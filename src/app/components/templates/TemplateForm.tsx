"use client";

import { useState } from "react";
import { toast } from "sonner";

type Props = {
    companyId: string;
    onCreated?: () => void;
};

export default function TemplateForm({ companyId, onCreated }: Props) {
    // Campos básicos
    const [name, setName] = useState("");
    const [category, setCategory] = useState<"MARKETING" | "UTILITY" | "AUTHENTICATION">("UTILITY");
    const [language, setLanguage] = useState("es_MX");
    const [bodyText, setBodyText] = useState("Hola {{1}}, gracias por contactarnos.");
    const [footerText, setFooterText] = useState("");

    // Estado de envío
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    // Opciones avanzadas
    const [parameterFormat, setParameterFormat] = useState<"POSITIONAL" | "NAMED">("POSITIONAL");

    // Encabezado
    const [headerType, setHeaderType] = useState<"NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT">("NONE");
    const [headerText, setHeaderText] = useState("");
    const [headerFile, setHeaderFile] = useState<File | null>(null);

    // Botones
    type ButtonItem =
        | { id: string; type: "QUICK_REPLY"; text: string }
        | { id: string; type: "URL"; text: string; url: string }
        | { id: string; type: "PHONE_NUMBER"; text: string; phone_number: string };

    const [buttons, setButtons] = useState<ButtonItem[]>([]);

    // Helpers
    function uid() {
        return Math.random().toString(36).slice(2, 10);
    }

    function insertVariable() {
        if (parameterFormat === "POSITIONAL") {
            const matches = [...bodyText.matchAll(/{{\s*(\d+)\s*}}/g)];
            const max = matches.length ? Math.max(...matches.map(m => parseInt(m[1], 10))) : 0;
            const next = max + 1;
            setBodyText(prev => `${prev}${prev.endsWith(" ") || prev.length === 0 ? "" : " "}{{${next}}}`);
        } else {
            const varName = typeof window !== "undefined"
                ? window.prompt("Nombre de la variable (ej: nombre, email)")
                : null;
            if (!varName) return;
            setBodyText(prev => `${prev}${prev.endsWith(" ") || prev.length === 0 ? "" : " "}{{${varName}}}`);
        }
    }

    function addQuickReply() {
        setButtons(prev => [...prev, { id: uid(), type: "QUICK_REPLY", text: "Responder" }]);
    }

    function addUrlButton() {
        setButtons(prev => [...prev, { id: uid(), type: "URL", text: "Abrir enlace", url: "https://tusitio.com" } as ButtonItem]);
    }

    function addPhoneButton() {
        setButtons(prev => [...prev, { id: uid(), type: "PHONE_NUMBER", text: "Llamar", phone_number: "" } as ButtonItem]);
    }

    function updateButton(id: string, patch: Partial<ButtonItem>) {
        setButtons(prev => prev.map(b => (b.id === id ? ({ ...b, ...patch } as ButtonItem) : b)));
    }

    function removeButton(id: string) {
        setButtons(prev => prev.filter(b => b.id !== id));
    }

    // Normalización del nombre para cumplir con reglas de Meta (minúsculas y _)
    function normalizeTemplateName(raw: string) {
        let s = raw.trim().toLowerCase();
        s = s.replace(/[\s\-.]+/g, "_");
        s = s.replace(/[^a-z_]/g, "");
        s = s.replace(/_+/g, "_");
        s = s.replace(/^_+|_+$/g, "");
        return s;
    }

    // Extrae mensaje amigable de un error JSON de Meta incrustado como string
    function extractMetaErrorMessage(errMessage: string) {
        try {
            const jsonStart = errMessage.indexOf("{");
            if (jsonStart >= 0) {
                const parsed = JSON.parse(errMessage.slice(jsonStart));
                const userMsg = parsed?.error?.error_user_msg || parsed?.error?.message;
                if (userMsg) return userMsg;
            }
        } catch {
            console.error("Error al parsear JSON de Meta:", errMessage);
        }
        const m = errMessage.match(/"error_user_msg":"([^"]+)"/);
        if (m?.[1]) return m[1];
        return "Ocurrió un error al crear la plantilla.";
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);

        if (!companyId) {
            const m = "Selecciona una empresa antes de crear la plantilla.";
            setMsg(m);
            toast.error(m);
            return;
        }

        if (!name) {
            const m = "Ingresa un nombre para la plantilla.";
            setMsg(m);
            toast.error(m);
            return;
        }

        // Reglas de Meta: nombre solo minúsculas y _
        let finalName = name;
        const validName = /^[a-z_]+$/.test(finalName);
        if (!validName) {
            const fixed = normalizeTemplateName(finalName);
            if (!fixed) {
                const m = "El nombre de la plantilla solo puede contener letras minúsculas y guiones bajos (_).";
                setMsg(m);
                toast.error(m);
                return;
            }
            finalName = fixed;
            setName(fixed);
            toast.message(`Nombre ajustado a "${fixed}" para cumplir con las reglas de Meta.`);
        }

        setIsSubmitting(true);
        try {
            // Construir components según selección
            const components: any[] = [];

            if (headerType !== "NONE") {
                if (headerType === "TEXT") {
                    if (!headerText.trim()) {
                        const m = "El encabezado en modo TEXTO requiere contenido.";
                        setMsg(m);
                        toast.error(m);
                        return;
                    }
                    components.push({
                        type: "HEADER",
                        format: "TEXT",
                        text: headerText.trim()
                    });
                } else {
                    // Media: requerimos archivo; el backend sube a Meta, obtiene media_id y completa example.header_handle
                    if (!headerFile) {
                        const m = "Selecciona un archivo para el encabezado (imagen/video/documento).";
                        setMsg(m);
                        toast.error(m);
                        return;
                    }
                    components.push({
                        type: "HEADER",
                        format: headerType
                        // example: lo completa el backend
                    });
                }
            }

            // BODY (obligatorio)
            components.push({
                type: "BODY",
                text: bodyText
            });

            // FOOTER (opcional)
            if (footerText.trim()) {
                components.push({
                    type: "FOOTER",
                    text: footerText.trim()
                });
            }

            // BUTTONS (opcionales)
            if (buttons.length > 0) {
                components.push({
                    type: "BUTTONS",
                    buttons: buttons.map(b => {
                        if (b.type === "QUICK_REPLY") return { type: "QUICK_REPLY", text: b.text };
                        if (b.type === "URL") return { type: "URL", text: b.text, url: (b as any).url };
                        return { type: "PHONE_NUMBER", text: b.text, phone_number: (b as any).phone_number };
                    })
                });
            }

            // Enviar al mismo endpoint
            let res: Response;

            if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && headerFile) {
                // multipart/form-data para que el backend suba el archivo y resuelva media_id
                const formData = new FormData();
                formData.append("companyId", companyId);
                formData.append("template", JSON.stringify({
                    name: finalName,
                    category,
                    language,
                    parameter_format: parameterFormat,
                    components
                }));
                formData.append("headerFile", headerFile, headerFile.name);

                res = await fetch("/api/templates/create", {
                    method: "POST",
                    body: formData
                });
            } else {
                // JSON plano
                res = await fetch("/api/templates/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        companyId,
                        template: {
                            name: finalName,
                            category,
                            language,
                            parameter_format: parameterFormat,
                            components
                        }
                    }),
                });
            }

            const json = await res.json().catch(() => ({} as any));
            if (!res.ok || !json?.ok) {
                const serverMsg = json?.error ? String(json.error) : `HTTP ${res.status}`;
                throw new Error(serverMsg);
            }

            const successMsg = "Plantilla enviada a revisión correctamente.";
            setMsg(successMsg);
            toast.success(successMsg);

            // Reset suave
            setName("");
            setHeaderType("NONE");
            setHeaderText("");
            setHeaderFile(null);
            setFooterText("");
            setButtons([]);
            if (onCreated) onCreated();
        } catch (err: any) {
            const friendly = extractMetaErrorMessage(err?.message || String(err));
            setMsg(friendly);
            toast.error(friendly);
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleHeaderFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) {
            setHeaderFile(null);
            return;
        }

        // Validaciones básicas por tipo de header
        if (headerType === "IMAGE" && !file.type.startsWith("image/")) {
            toast.error("Selecciona una imagen válida (JPG/PNG).");
            return;
        }
        if (headerType === "VIDEO" && !file.type.startsWith("video/")) {
            toast.error("Selecciona un video válido (MP4, etc.).");
            return;
        }
        if (headerType === "DOCUMENT" && !file.type.startsWith("application/")) {
            toast.error("Selecciona un documento válido (PDF, etc.).");
            return;
        }
        setHeaderFile(file);
    }

    return (
        <form onSubmit={handleCreate} className="space-y-4">
            {/* Campos básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium">Nombre de plantilla</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-md border px-3 py-2"
                        placeholder="ej: bienvenida_clientes"
                    />
                    <p className="mt-1 text-xs text-gray-500">Solo letras minúsculas y guiones bajos (_).</p>
                </div>
                <div>
                    <label className="text-sm font-medium">Categoría</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full rounded-md border px-3 py-2"
                    >
                        <option value="UTILITY">UTILIDAD</option>
                        <option value="MARKETING">MARKETING</option>
                        <option value="AUTHENTICATION">AUTENTICACIÓN</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium">Idioma</label>
                    <input
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full rounded-md border px-3 py-2"
                        placeholder="es_MX"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Formato de variables</label>
                    <select
                        value={parameterFormat}
                        onChange={(e) => setParameterFormat(e.target.value as any)}
                        className="w-full rounded-md border px-3 py-2"
                    >
                        <option value="POSITIONAL">{"Posicional {{1}}, {{2}}"}</option>
                        <option value="NAMED">{"Nombradas ({{nombre}}, {{email}})"}</option>
                    </select>
                </div>
            </div>

            {/* Encabezado */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Encabezado</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                        value={headerType}
                        onChange={(e) => {
                            setHeaderType(e.target.value as any);
                            setHeaderFile(null); // limpiar archivo al cambiar tipo
                        }}
                        className="w-full rounded-md border px-3 py-2"
                    >
                        <option value="NONE">Sin encabezado</option>
                        <option value="TEXT">Texto</option>
                        <option value="IMAGE">Imagen</option>
                        <option value="VIDEO">Video</option>
                        <option value="DOCUMENT">Documento</option>
                    </select>

                    {headerType === "TEXT" && (
                        <input
                            value={headerText}
                            onChange={(e) => setHeaderText(e.target.value)}
                            className="w-full rounded-md border px-3 py-2 md:col-span-2"
                            placeholder="Ej: ¡Oferta por tiempo limitado!"
                        />
                    )}

                    {["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType) && (
                        <div className="md:col-span-2 space-y-1">
                            <input
                                type="file"
                                accept={
                                    headerType === "IMAGE"
                                        ? "image/*"
                                        : headerType === "VIDEO"
                                        ? "video/*"
                                        : ".pdf,application/*"
                                }
                                onChange={handleHeaderFileChange}
                                className="w-full rounded-md border px-3 py-2"
                            />
                            {headerFile && (
                                <p className="text-xs text-gray-600">
                                    Archivo seleccionado: {headerFile.name}
                                </p>
                            )}
                            <p className="text-xs text-gray-500">
                                Se subirá automáticamente a Meta al crear la plantilla. No necesitas Media ID.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Cuerpo */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Cuerpo</label>
                    <button
                        type="button"
                        onClick={insertVariable}
                        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                        title="Insertar variable"
                    >
                        Insertar variable
                    </button>
                </div>
                <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                    rows={5}
                    placeholder="Hola {{1}}, gracias por contactarnos."
                />
            </div>

            {/* Pie */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Pie (opcional)</label>
                <input
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                    placeholder="Ej: Responde STOP para dejar de recibir mensajes."
                />
            </div>

            {/* Botones */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Botones (opcional)</label>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={addQuickReply}
                            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                        >
                            + Respuesta rápida
                        </button>
                        <button
                            type="button"
                            onClick={addUrlButton}
                            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                        >
                            + URL
                        </button>
                        <button
                            type="button"
                            onClick={addPhoneButton}
                            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                        >
                            + Teléfono
                        </button>
                    </div>
                </div>

                {buttons.length > 0 && (
                    <div className="space-y-2">
                        {buttons.map((b) => (
                            <div key={b.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center border rounded p-2">
                                <div className="text-xs font-medium">{b.type}</div>

                                {/* Texto común */}
                                <input
                                    value={b.text}
                                    onChange={(e) => updateButton(b.id, { text: e.target.value } as any)}
                                    className="w-full rounded-md border px-2 py-1"
                                    placeholder="Texto del botón"
                                />

                                {/* Campos específicos */}
                                {b.type === "URL" && (
                                    <input
                                        value={(b as any).url}
                                        onChange={(e) => updateButton(b.id, { url: e.target.value } as any)}
                                        className="w-full rounded-md border px-2 py-1"
                                        placeholder="https://tusitio.com"
                                    />
                                )}
                                {b.type === "PHONE_NUMBER" && (
                                    <input
                                        value={(b as any).phone_number}
                                        onChange={(e) => updateButton(b.id, { phone_number: e.target.value } as any)}
                                        className="w-full rounded-md border px-2 py-1"
                                        placeholder="+52 555 555 5555"
                                    />
                                )}

                                <div className="md:col-span-3 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeButton(b.id)}
                                        className="text-xs px-2 py-1 rounded border hover:bg-red-50"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-black hover:bg-black/80 text-white px-3 py-2 text-sm"
                >
                    {isSubmitting ? "Enviando..." : "Crear plantilla"}
                </button>
                {msg && <span className="text-sm text-gray-600">{msg}</span>}
            </div>
        </form>
    );
}