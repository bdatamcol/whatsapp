import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createTemplate, CreateTemplatePayload } from "@/lib/whatsapp/templates/metaTemplatesApi";
import { decryptData as decryptDataShared } from '@/lib/security/crypto';

export const runtime = 'nodejs';

function getSupabaseServer() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error("Supabase URL o Service Key no configurados.");
    return createClient(url, serviceKey);
}

export async function POST(req: NextRequest) {
    try {
        // Nuevo: soportar JSON y multipart/form-data
        const contentType = req.headers.get("content-type") || "";

        let companyId: string | undefined;
        let template: CreateTemplatePayload | undefined;
        let headerFile: File | null = null;

        if (contentType.includes("multipart/form-data")) {
            const form = await req.formData();
            companyId = (form.get("companyId") as string) || undefined;
            const templateStr = (form.get("template") as string) || "";
            if (templateStr) {
                try {
                    template = JSON.parse(templateStr) as CreateTemplatePayload;
                } catch {
                    return NextResponse.json({ ok: false, error: "template inválido (JSON)" }, { status: 400 });
                }
            }
            headerFile = (form.get("headerFile") as File) || null;
        } else {
            const body = await req.json();
            companyId = body?.companyId;
            template = body?.template;
        }

        if (!companyId) {
            return NextResponse.json({ ok: false, error: "Falta companyId" }, { status: 400 });
        }
        if (!template?.name || !template?.category || !template?.language || !template?.components?.length) {
            return NextResponse.json({ ok: false, error: "template incompleto" }, { status: 400 });
        }

        console.log("🔍 Template recibido:", JSON.stringify(template, null, 2));

        const supabase = getSupabaseServer();
        const { data: company, error } = await supabase
            .from("companies")
            .select("id,name,waba_id,phone_number_id,facebook_access_token,whatsapp_access_token")
            .eq("id", companyId)
            .maybeSingle();

        if (error) throw error;
        if (!company) {
            return NextResponse.json({ ok: false, error: "Empresa no encontrada" }, { status: 404 });
        }
        if (!company.waba_id) {
            return NextResponse.json({ ok: false, error: "La empresa no tiene waba_id configurado" }, { status: 400 });
        }

        const secretKey = process.env.ENCRYPTION_KEY;
        const rawWabaId = company?.waba_id ?? '';
        const rawToken = company?.facebook_access_token || company?.whatsapp_access_token || undefined;
        const rawPhoneNumberId = company?.phone_number_id ?? '';

        const wabaId = secretKey ? decryptDataShared(rawWabaId, secretKey) : rawWabaId;
        const tokenOverride = rawToken ? (secretKey ? decryptDataShared(rawToken, secretKey) : rawToken) : undefined;
        const phoneNumberId = secretKey ? decryptDataShared(rawPhoneNumberId, secretKey) : rawPhoneNumberId;

        console.log("🔐 Datos descifrados:", {
            wabaId: wabaId?.slice(-4), // Solo los últimos 4 para debug
            hasToken: !!tokenOverride,
            phoneNumberId: phoneNumberId?.slice(-4)
        });

        // Normalización del payload (como antes)
        const normalizeTemplate = (tpl: CreateTemplatePayload) => {
            const name = tpl.name.trim().toLowerCase().replace(/\s+/g, '_');
            const category = String(tpl.category).toUpperCase() as CreateTemplatePayload['category'];
            const parameter_format = (tpl as any).parameter_format || 'POSITIONAL';
            const normalizedComponents = (tpl.components as any[])
                .filter(Boolean)
                .map((c: any) => {
                    if (!c?.type) return null;
                    if (c.type === 'HEADER') {
                        if (c.format === 'NONE') return null;
                        if (c.format === 'TEXT') {
                            if (!c.text || typeof c.text !== 'string' || !c.text.trim()) {
                                throw new Error('HEADER TEXT requiere "text"');
                            }
                            return { type: 'HEADER', format: 'TEXT', text: c.text, example: c.example };
                        }
                        if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(c.format)) {
                            return { type: 'HEADER', format: c.format, example: c.example };
                        }
                        throw new Error(`HEADER con formato no soportado: ${c.format}`);
                    }
                    if (c.type === 'BODY') {
                        if (!c.text || typeof c.text !== 'string' || !c.text.trim()) {
                            throw new Error('BODY requiere "text"');
                        }
                        return { type: 'BODY', text: c.text, example: c.example };
                    }
                    if (c.type === 'FOOTER') {
                        if (!c.text || typeof c.text !== 'string' || !c.text.trim()) {
                            return null;
                        }
                        return { type: 'FOOTER', text: c.text };
                    }
                    if (c.type === 'BUTTONS') {
                        const buttons = Array.isArray(c.buttons) ? c.buttons
                            .filter(Boolean)
                            .map((b: any) => {
                                if (b.type === 'URL' && typeof b.url === 'string') {
                                    let u = b.url.trim();
                                    if ((u.startsWith('`') && u.endsWith('`')) ||
                                        (u.startsWith('"') && u.endsWith('"')) ||
                                        (u.startsWith("'") && u.endsWith("'"))) {
                                        u = u.slice(1, -1).trim();
                                    }
                                    return { ...b, url: u };
                                }
                                return b;
                            }) : [];
                        if (buttons.length === 0) return null;
                        return { type: 'BUTTONS', buttons };
                    }
                    return c;
                })
                .filter(Boolean);
            return { ...tpl, name, category, parameter_format, components: normalizedComponents } as CreateTemplatePayload & { parameter_format?: 'POSITIONAL' | 'NAMED' };
        };

        const normalizedTemplate = normalizeTemplate(template);
        console.log("✨ Template normalizado:", JSON.stringify(normalizedTemplate, null, 2));

        // Nuevo: si HEADER es media y no trae example, subimos por Resumable Upload para obtener un handle (h)
        const headerIdx = normalizedTemplate.components.findIndex((c: any) => c?.type === 'HEADER');
        if (headerIdx !== -1) {
            const header = normalizedTemplate.components[headerIdx] as any;
            if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header?.format)) {
                const hasHandle = !!header?.example?.header_handle?.length;
                console.log("📂 Header de media encontrado:", {
                    format: header.format,
                    hasHandle,
                    hasFile: !!headerFile,
                    example: header.example
                });

                if (!hasHandle) {
                    if (!headerFile) {
                        return NextResponse.json(
                            { ok: false, error: "El encabezado de tipo media requiere un archivo (headerFile) o un example válido." },
                            { status: 400 }
                        );
                    }

                    const apiVersion = process.env.META_API_VERSION;
                    const appId = process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
                    if (!appId) {
                        return NextResponse.json(
                            { ok: false, error: "Falta FACEBOOK_APP_ID en variables de entorno para Resumable Upload" },
                            { status: 500 }
                        );
                    }
                    if (!tokenOverride) {
                        return NextResponse.json(
                            { ok: false, error: "No hay token configurado para subir media" },
                            { status: 400 }
                        );
                    }

                    console.log("📤 Iniciando Resumable Upload...", {
                        appId,
                        fileName: (headerFile as any).name,
                        fileSize: headerFile.size,
                        fileType: headerFile.type
                    });

                    const baseUrl = `https://graph.facebook.com/${apiVersion}`;

                    try {
                        // Paso 1: crear sesión
                        const createSessionRes = await fetch(`${baseUrl}/${appId}/uploads`, {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${tokenOverride}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                file_length: headerFile.size,
                                file_type: headerFile.type || (String(header.format).toLowerCase() === 'image' ? 'image/jpeg' :
                                    String(header.format).toLowerCase() === 'video' ? 'video/mp4' :
                                        'application/pdf'),
                                file_name: (headerFile as any).name || `header.${String(header.format).toLowerCase()}`
                            })
                        });
                        const sessionJson = await createSessionRes.json();

                        console.log("📋 Sesión de upload:", {
                            status: createSessionRes.status,
                            sessionId: sessionJson?.id,
                            response: sessionJson
                        });

                        if (!createSessionRes.ok || !sessionJson?.id) {
                            const msg = sessionJson?.error?.message || JSON.stringify(sessionJson);
                            return NextResponse.json({ ok: false, error: `Error creando sesión de upload: ${msg}` }, { status: createSessionRes.status || 500 });
                        }

                        // Paso 2: subir binario a la sesión
                        const sessionId = sessionJson.id as string;
                        const buffer = Buffer.from(await headerFile.arrayBuffer());

                        console.log("⬆️ Subiendo archivo binario...", {
                            sessionId,
                            bufferSize: buffer.length
                        });

                        const uploadRes2 = await fetch(`${baseUrl}/${sessionId}`, {
                            method: "POST",
                            headers: {
                                // Importante: OAuth en lugar de Bearer para el paso 2
                                Authorization: `OAuth ${tokenOverride}`,
                                "file_offset": "0",
                                "Content-Type": "application/octet-stream"
                            },
                            body: buffer
                        });
                        const upload2Json = await uploadRes2.json();

                        console.log("📋 Upload binario:", {
                            status: uploadRes2.status,
                            handle: upload2Json?.h,
                            response: upload2Json
                        });

                        if (!uploadRes2.ok || !upload2Json?.h) {
                            const msg = upload2Json?.error?.message || JSON.stringify(upload2Json);
                            return NextResponse.json({ ok: false, error: `Error subiendo bytes a la sesión: ${msg}` }, { status: uploadRes2.status || 500 });
                        }

                        const handle = upload2Json.h as string;
                        const updatedHeader = { ...header, example: { header_handle: [handle] } };
                        const newComponents = [...(normalizedTemplate.components as any[])];
                        newComponents[headerIdx] = updatedHeader;
                        (normalizedTemplate as any).components = newComponents;

                        console.log("✅ Media upload completado, handle:", handle);
                    } catch (uploadError: any) {
                        console.error("❌ Error en Resumable Upload:", uploadError);
                        return NextResponse.json({
                            ok: false,
                            error: `Error en upload de media: ${uploadError.message}`
                        }, { status: 500 });
                    }
                }
            }
        }

        console.log("🚀 Enviando template a Meta:", {
            wabaId: wabaId?.slice(-4),
            templateName: normalizedTemplate.name
        });

        const result = await createTemplate(wabaId, normalizedTemplate, tokenOverride);

        console.log("✅ Template creado exitosamente:", result);
        return NextResponse.json({ ok: true, result });
    } catch (err: any) {
        console.error("❌ Error completo:", err);
        console.error("Stack trace:", err.stack);
        return NextResponse.json({
            ok: false,
            error: err.message || "Error interno del servidor",
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 });
    }
}