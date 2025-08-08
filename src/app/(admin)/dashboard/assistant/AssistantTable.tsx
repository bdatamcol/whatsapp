'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Assistant = {
    id: string;
    email: string;
    is_active: boolean;
    created_at: string;
};

export default function AssistantTable() {
    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [assistantToDelete, setAssistantToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchAssistants();
    }, []);

    const fetchAssistants = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/list-assistants');
        const data = await res.json();
        if (Array.isArray(data)) setAssistants(data);
        setLoading(false);
    };

    const toggleAssistantStatus = async (assistantId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/assistants/${assistantId}/toggle-active`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            if (res.ok) {
                toast.success(`Asistente ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
                fetchAssistants();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al cambiar estado');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const deleteAssistant = async () => {
        if (!assistantToDelete) return;

        try {
            const res = await fetch(`/api/admin/assistants/${assistantToDelete}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Asistente eliminado exitosamente');
                fetchAssistants();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al eliminar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
        
        setDeleteDialogOpen(false);
        setAssistantToDelete(null);
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-md text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                    <tr>
                        <th className="px-4 py-2 border-b">#</th>
                        <th className="px-4 py-2 border-b">Correo electrónico</th>
                        <th className="px-4 py-2 border-b">Estado</th>
                        <th className="px-4 py-2 border-b">Fecha de registro</th>
                        <th className="px-4 py-2 border-b">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="text-center py-4 text-muted-foreground">
                                Cargando...
                            </td>
                        </tr>
                    ) : assistants.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center py-4 text-muted-foreground">
                                No hay asesores registrados aún.
                            </td>
                        </tr>
                    ) : (
                        assistants.map((assistant, index) => (
                            <tr key={assistant.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-2">{index + 1}</td>
                                <td className="px-4 py-2 font-medium">{assistant.email}</td>
                                <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={assistant.is_active}
                                            onCheckedChange={() => toggleAssistantStatus(assistant.id, assistant.is_active)}
                                        />
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                            assistant.is_active 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {assistant.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-2">
                                    {new Date(assistant.created_at).toLocaleDateString('es-CO')}
                                </td>
                                <td className="px-4 py-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => {
                                            setAssistantToDelete(assistant.id);
                                            setDeleteDialogOpen(true);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción desactivará permanentemente al asistente y no podrá acceder al sistema. 
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteAssistant} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
