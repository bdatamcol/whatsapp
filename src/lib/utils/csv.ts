/**
 * Utilidad para exportar datos a CSV con soporte para caracteres especiales
 */

interface CSVOptions {
    filename?: string;
    headers?: string[];
    includeTimestamp?: boolean;
}

export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    options: CSVOptions = {}
) {
    if (!data.length) return;
    // Agregar BOM para Excel
    const BOM = '\uFEFF';

    // Determinar encabezados
    const headers = options.headers || Object.keys(data[0]);

    // Convertir datos a formato CSV
    const rows = [
        headers.join(','),
        ...data.map(item =>
            headers
                .map(header => {
                    const value = item[header];
                    // Manejar diferentes tipos de datos
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'string') {
                        // Escapar comillas y envolver en comillas si contiene comas o saltos de línea
                        const escaped = value.replace(/"/g, '""');
                        return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')
                            ? `"${escaped}"`
                            : escaped;
                    }
                    if (value instanceof Date) return value.toLocaleString();
                    return String(value);
                })
                .join(',')
        ),
    ];

    // Crear Blob con BOM y contenido CSV
    const csvContent = BOM + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

    // Generar nombre de archivo
    const timestamp = options.includeTimestamp
        ? `_${new Date().toISOString().split('T')[0]}`
        : '';
    const filename = `${options.filename || 'export'}${timestamp}.csv`;

    // Crear URL y descargar
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}