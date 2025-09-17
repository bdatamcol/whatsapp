"use client";

type Props = {
    templates: any[];
    loading?: boolean;
    onRefresh?: () => void;
};

function statusColor(status?: string) {
    switch (status) {
        case "APPROVED":
            return "bg-green-100 text-green-800";
        case "PENDING":
            return "bg-yellow-100 text-yellow-800";
        case "REJECTED":
            return "bg-red-100 text-red-800";
        case "PAUSED":
            return "bg-gray-100 text-gray-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

export default function TemplateList({ templates, loading, onRefresh }: Props) {
    if (loading) {
        return <div className="text-sm text-gray-600">Cargando plantillas...</div>;
    }

    if (!templates?.length) {
        return (
            <div className="text-sm text-gray-600">
                No hay plantillas para esta empresa.
                <div className="mt-2">
                    <button className="text-indigo-600 hover:underline text-sm" onClick={onRefresh}>Refrescar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">{templates.length} plantillas</div>
                <button className="text-dark-600 hover:underline text-sm" onClick={onRefresh}>Refrescar</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-1">
                {templates.map((tpl: any) => (
                    <div key={`${tpl.name}-${tpl.language}`} className="rounded-md border p-3">
                        <div className="flex items-center justify-between">
                            <div className="font-medium">{tpl.name}</div>
                            <span className={`text-xs px-2 py-1 rounded ${statusColor(tpl.status)}`}>
                                {tpl.status || "UNKNOWN"}
                            </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">Idioma: {tpl.language}</div>
                        {tpl.category ? <div className="text-xs text-gray-500">Categoría: {tpl.category}</div> : null}
                    </div>
                ))}
            </div>
        </div>
    );
}