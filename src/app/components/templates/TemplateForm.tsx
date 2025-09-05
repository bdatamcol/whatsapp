"use client";

import { useState } from "react";

type Props = {
    companyId: string;
    onCreated?: () => void;
};

export default function TemplateForm({ companyId, onCreated }: Props) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState<"MARKETING" | "UTILITY" | "AUTHENTICATION">("UTILITY");
    const [language, setLanguage] = useState("es_MX");
    const [bodyText, setBodyText] = useState("Hola {{1}}, gracias por contactarnos.");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        if (!companyId) {
            setMsg("Selecciona una empresa antes de crear la plantilla.");
            return;
        }
        if (!name) {
            setMsg("Ingresa un nombre para la plantilla.");
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                companyId,
                template: {
                    name,
                    category,
                    language,
                    parameter_format: "POSITIONAL",
                    components: [
                        {
                            type: "BODY",
                            text: bodyText,
                        },
                    ],
                },
            };

            const res = await fetch("/api/templates/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!json.ok) throw new Error(json.error || "Error creando plantilla");
            setMsg("Plantilla enviada a revisión correctamente.");
            setName("");
            if (onCreated) onCreated();
        } catch (err: any) {
            setMsg(err.message || "Error");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1">
                <label className="text-sm font-medium">Nombre</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="bienvenida_lead"
                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500">Usa minúsculas, números y guión bajo.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Categoría</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="UTILITY">UTILITY</option>
                        <option value="MARKETING">MARKETING</option>
                        <option value="AUTHENTICATION">AUTHENTICATION</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Idioma</label>
                    <input
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        placeholder="es_MX"
                        className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500">Ejemplos: es_MX, es_ES, en_US.</p>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium">Cuerpo</label>
                <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {/* <p className="text-xs text-gray-500">Puedes usar variables como {{1}}, {{2}} (POSITIONAL).</p> */}
                <p className="text-xs text-gray-500">Puedes usar variables como 1, 2 (POSITIONAL).</p>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={isSubmitting || !companyId}
                    className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm disabled:opacity-60"
                >
                    {isSubmitting ? "Creando..." : "Crear plantilla"}
                </button>
                {msg ? <div className="text-sm">{msg}</div> : null}
            </div>
        </form>
    );
}