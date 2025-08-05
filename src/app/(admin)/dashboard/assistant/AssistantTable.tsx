'use client';

import { useEffect, useState } from 'react';

type Assistant = {
    id: string;
    email: string;
};

export default function AssistantTable() {
    const [assistants, setAssistants] = useState<Assistant[]>([]);

    useEffect(() => {
        const fetchAssistants = async () => {
            const res = await fetch('/api/admin/list-assistants');
            const data = await res.json();
            if (Array.isArray(data)) setAssistants(data);
        };

        fetchAssistants();
    }, []);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-md text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                    <tr>
                        <th className="px-4 py-2 border-b">#</th>
                        <th className="px-4 py-2 border-b">Correo electrónico</th>
                    </tr>
                </thead>
                <tbody>
                    {assistants.length === 0 ? (
                        <tr>
                            <td colSpan={2} className="text-center py-4 text-muted-foreground">
                                No hay asesores registrados aún.
                            </td>
                        </tr>
                    ) : (
                        assistants.map((a, i) => (
                            <tr key={a.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-2">{i + 1}</td>
                                <td className="px-4 py-2">{a.email}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
