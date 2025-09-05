import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createTemplate, CreateTemplatePayload } from "@/lib/whatsapp/templates/metaTemplatesApi";
import { decryptData as decryptDataShared } from '@/lib/security/crypto';

function getSupabaseServer() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error("Supabase URL o Service Key no configurados.");
    return createClient(url, serviceKey);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const companyId: string | undefined = body?.companyId;
        const template: CreateTemplatePayload | undefined = body?.template;

        if (!companyId) {
            return NextResponse.json({ ok: false, error: "Falta companyId" }, { status: 400 });
        }
        if (!template?.name || !template?.category || !template?.language || !template?.components?.length) {
            return NextResponse.json({ ok: false, error: "template incompleto" }, { status: 400 });
        }

        const supabase = getSupabaseServer();
        const { data: company, error } = await supabase
            .from("companies")
            .select("id,name,waba_id,facebook_access_token,whatsapp_access_token")
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

        const wabaId = secretKey ? decryptDataShared(rawWabaId, secretKey) : rawWabaId;
        const tokenOverride = rawToken ? (secretKey ? decryptDataShared(rawToken, secretKey) : rawToken) : undefined;

        const result = await createTemplate(wabaId, template, tokenOverride);
        return NextResponse.json({ ok: true, result });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err.message || "Error" }, { status: 500 });
    }
}