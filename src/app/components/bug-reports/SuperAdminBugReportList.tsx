'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Bug,
    Calendar,
    Mail,
    AlertCircle,
    ExternalLink,
    Trash2,
    Edit3,
    Building2,
    Filter,
    TrendingUp,
    CheckCircle2,
    Clock,
    XCircle,
    Tag,
    Globe,
    Monitor
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/card';

interface BugReport {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    reporter_email?: string;
    created_at: string;
    screenshot_url?: string;
    browser_info?: string;
    device_info?: string;
    os_info?: string;
    url?: string;
    company_name?: string;
    reporter_name?: string;
    notes?: string;
    assigned_to?: string;
}

export default function SuperAdminBugReportList() {
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');

    const queryClient = useQueryClient();

    const { data: reports, isLoading } = useQuery({
        queryKey: ['superadmin-bug-reports', statusFilter, priorityFilter, categoryFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (priorityFilter !== 'all') params.append('priority', priorityFilter);
            if (categoryFilter !== 'all') params.append('category', categoryFilter);

            const response = await fetch(`/api/superadmin/bug-reports?${params}`);
            if (!response.ok) throw new Error('Error al cargar reportes');
            return response.json();
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, status }: any) => {
            const response = await fetch(`/api/superadmin/bug-reports/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.details || responseData.error || 'Error al actualizar');
            }
            return responseData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-bug-reports'] });
            toast.success('Reporte actualizado exitosamente');
            setEditModalOpen(false);
        },
        onError: (error: Error) => {
            toast.error(`Error al actualizar: ${error.message}`);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/superadmin/bug-reports/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Error al eliminar');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin-bug-reports'] });
            toast.success('Reporte eliminado exitosamente');
        },
        onError: () => {
            toast.error('Error al eliminar el reporte');
        }
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open': return <Clock className="w-4 h-4" />;
            case 'in_progress': return <TrendingUp className="w-4 h-4" />;
            case 'resolved': return <CheckCircle2 className="w-4 h-4" />;
            case 'closed': return <XCircle className="w-4 h-4" />;
            default: return <Bug className="w-4 h-4" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'critical': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'in_progress': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'resolved': return 'bg-green-50 text-green-700 border-green-200';
            case 'closed': return 'bg-gray-50 text-gray-700 border-gray-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const categoryOptions = [
        { value: 'all', label: 'Todas las categorías', icon: Tag },
        { value: 'ui', label: 'Interfaz de Usuario', icon: Monitor },
        { value: 'api', label: 'API', icon: Globe },
        { value: 'performance', label: 'Rendimiento', icon: TrendingUp },
        { value: 'security', label: 'Seguridad', icon: AlertCircle },
        { value: 'other', label: 'Otro', icon: Bug }
    ];

    const handleEdit = (report: BugReport) => {
        setSelectedReport(report);
        setNewStatus(report.status);
        setEditModalOpen(true);
    };

    const handleUpdate = () => {
        if (selectedReport) {
            updateMutation.mutate({
                id: selectedReport.id,
                status: newStatus,
            });
        }
    };

    const stats = reports ? {
        total: reports.length,
        open: reports.filter((r: BugReport) => r.status === 'open').length,
        inProgress: reports.filter((r: BugReport) => r.status === 'in_progress').length,
        resolved: reports.filter((r: BugReport) => r.status === 'resolved').length,
        critical: reports.filter((r: BugReport) => r.priority === 'critical').length
    } : { total: 0, open: 0, inProgress: 0, resolved: 0, critical: 0 };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-8 border border-slate-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">
                            Centro de Gestión de Bugs
                        </h1>
                        <p className="text-slate-600 text-lg">
                            Administración completa de reportes y seguimiento
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-slate-600">Abiertos</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.open}</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-sm text-slate-600">En Progreso</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.inProgress}</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-slate-600">Resueltos</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.resolved}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros Modernos */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-600" />
                        <CardTitle className="text-lg font-semibold text-slate-900">
                            Filtros Avanzados
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Estado</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full border-slate-200 rounded-lg">
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="open">Abiertos</SelectItem>
                                    <SelectItem value="in_progress">En Progreso</SelectItem>
                                    <SelectItem value="resolved">Resueltos</SelectItem>
                                    <SelectItem value="closed">Cerrados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Prioridad</label>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger className="w-full border-slate-200 rounded-lg">
                                    <SelectValue placeholder="Seleccionar prioridad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las prioridades</SelectItem>
                                    <SelectItem value="low">Baja</SelectItem>
                                    <SelectItem value="medium">Media</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="critical">Crítica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Categoría</label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full border-slate-200 rounded-lg">
                                    <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <option.icon className="w-4 h-4" />
                                                {option.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Reportes */}
            <div className="space-y-4">
                {isLoading ? (
                    <Card className="border-slate-200">
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                                <p className="text-slate-600 mt-4">Cargando reportes...</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : reports?.length === 0 ? (
                    <Card className="border-slate-200">
                        <CardContent className="py-12 text-center">
                            <Bug className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">No hay reportes</h3>
                            <p className="text-slate-600">No se encontraron reportes con los filtros seleccionados</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {reports?.map((report: BugReport) => (
                            <Card
                                key={report.id}
                                className="border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-slate-300"
                            >
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                                        {report.title}
                                                    </h3>
                                                    <p className="text-slate-600 text-sm line-clamp-2">
                                                        {report.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <Badge className={`${getPriorityColor(report.priority)} border font-medium`}>
                                                    {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)}
                                                </Badge>
                                                <Badge className={`${getStatusColor(report.status)} border font-medium`}>
                                                    <span className="mr-1">{getStatusIcon(report.status)}</span>
                                                    {report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </Badge>
                                                <Badge variant="outline" className="border-slate-200 text-slate-700">
                                                    <Tag className="w-3 h-3 mr-1" />
                                                    {report.category}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                                {report.company_name && (
                                                    <div className="flex items-center gap-1">
                                                        <Building2 className="w-4 h-4" />
                                                        <span>{report.company_name}</span>
                                                    </div>
                                                )}
                                                {report.reporter_email && (
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="w-4 h-4" />
                                                        <span>{report.reporter_email}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{format(new Date(report.created_at), 'PP', { locale: es })}</span>
                                                </div>
                                                {report.screenshot_url && (
                                                    <div className="flex items-center gap-1">
                                                        <AlertCircle className="w-4 h-4 text-blue-600" />
                                                        <button
                                                            className="text-blue-600 hover:text-blue-700 font-medium"
                                                            onClick={() => setSelectedReport(report)}
                                                        >
                                                            Ver captura
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 lg:flex-col lg:items-end lg:justify-start">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedReport(report)}
                                                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleEdit(report)}
                                                className="bg-black hover:bg-gray-800 text-white"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => deleteMutation.mutate(report.id)}
                                                disabled={deleteMutation.isPending}
                                                className="bg-black hover:bg-gray-800 text-white"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Detalles */}
            <Dialog 
                open={selectedReport !== null} 
                onOpenChange={(open) => !open && setSelectedReport(null)}
            >
                <DialogContent className="max-w-[80vw] w-[80vw] max-h-[80vh] overflow-y-auto rounded-xl border-slate-200 sm:max-w-[80vw]">
                    <DialogHeader className="border-b border-slate-100 pb-4">
                        <DialogTitle className="text-2xl font-semibold text-slate-900">
                            {selectedReport?.title}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="p-6">
                            {/* Badges */}
                            <div className="flex flex-wrap gap-3 mb-6">
                                <Badge className={`${getPriorityColor(selectedReport.priority)} border font-medium text-sm px-3 py-1`}>
                                    {selectedReport.priority.charAt(0).toUpperCase() + selectedReport.priority.slice(1)} Prioridad
                                </Badge>
                                <Badge className={`${getStatusColor(selectedReport.status)} border font-medium text-sm px-3 py-1`}>
                                    <span className="mr-1">{getStatusIcon(selectedReport.status)}</span>
                                    {selectedReport.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                                <Badge variant="outline" className="border-slate-200 text-slate-700 text-sm px-3 py-1">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {selectedReport.category}
                                </Badge>
                            </div>

                            {/* Layout principal en 2 columnas */}
                            <div className="grid lg:grid-cols-2 gap-8">
                                {/* Columna izquierda - Descripción y captura */}
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-xl">
                                        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                                            <Bug className="w-5 h-5" />
                                            Descripción del Problema
                                        </h4>
                                        <div className="text-slate-700 bg-white p-4 rounded-lg text-base leading-relaxed border">
                                            {selectedReport.description}
                                        </div>
                                    </div>

                                    {selectedReport.screenshot_url && (
                                        <div className="bg-slate-50 p-6 rounded-xl">
                                            <h4 className="font-semibold text-slate-900 mb-4 text-lg">Captura de Pantalla</h4>
                                            <div className="bg-white p-4 rounded-lg border">
                                                <Image
                                                    src={selectedReport.screenshot_url}
                                                    alt="Screenshot"
                                                    width={800}
                                                    height={600}
                                                    className="rounded-lg w-full h-auto shadow-sm"
                                                    style={{ maxWidth: '100%', height: 'auto' }}
                                                    priority
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Columna derecha - Información */}
                                <div className="space-y-6">
                                    {/* Información del Reportador */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                                        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                                            <Building2 className="w-5 h-5" />
                                            Información del Reportador
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedReport.company_name && (
                                                <div className="bg-white p-4 rounded-lg border">
                                                    <span className="text-slate-600 block text-xs font-medium uppercase tracking-wide mb-1">Empresa</span>
                                                    <span className="font-semibold text-slate-900 text-base">{selectedReport.company_name}</span>
                                                </div>
                                            )}
                                            {selectedReport.reporter_name && (
                                                <div className="bg-white p-4 rounded-lg border">
                                                    <span className="text-slate-600 block text-xs font-medium uppercase tracking-wide mb-1">Nombre</span>
                                                    <span className="font-semibold text-slate-900 text-base">{selectedReport.reporter_name}</span>
                                                </div>
                                            )}
                                            {selectedReport.reporter_email && (
                                                <div className="bg-white p-4 rounded-lg border">
                                                    <span className="text-slate-600 block text-xs font-medium uppercase tracking-wide mb-1">Email</span>
                                                    <span className="font-semibold text-slate-900 text-base break-words">{selectedReport.reporter_email}</span>
                                                </div>
                                            )}
                                            <div className="bg-white p-4 rounded-lg border">
                                                <span className="text-slate-600 block text-xs font-medium uppercase tracking-wide mb-1">Fecha de Reporte</span>
                                                <span className="font-semibold text-slate-900 text-base">
                                                    {format(new Date(selectedReport.created_at), 'PPpp', { locale: es })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información Técnica */}
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                                        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                                            <Globe className="w-5 h-5" />
                                            Información Técnica
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="bg-white p-4 rounded-lg border">
                                                <span className="text-slate-600 block text-xs font-medium uppercase tracking-wide mb-1">URL</span>
                                                <span className="font-semibold text-slate-900 text-base break-words">{selectedReport.url || 'No especificada'}</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border">
                                                <span className="text-slate-600 block text-xs font-medium uppercase tracking-wide mb-1">Navegador</span>
                                                <span className="font-semibold text-slate-900 text-base">{selectedReport.browser_info || 'No especificado'}</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border">
                                                <span className="text-slate-600 block text-xs font-medium uppercase tracking-wide mb-1">Dispositivo</span>
                                                <span className="font-semibold text-slate-900 text-base">{selectedReport.device_info || 'No especificado'}</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border">
                                                <span className="text-slate-600 block text-xs font-medium uppercase tracking-wide mb-1">Sistema Operativo</span>
                                                <span className="font-semibold text-slate-900 text-base">{selectedReport.os_info || 'No especificado'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notas Administrativas */}
                                    {selectedReport.notes && (
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                                            <h4 className="font-semibold text-slate-900 mb-4 text-lg">Notas Administrativas</h4>
                                            <div className="bg-white p-4 rounded-lg border">
                                                <p className="text-slate-700 text-base leading-relaxed">
                                                    {selectedReport.notes}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex gap-4 pt-6 mt-6 border-t border-slate-200 flex justify-end">

                                <Button 
                                    onClick={() => handleEdit(selectedReport)}
                                    className="bg-black hover:bg-gray-800 text-white px-6 py-2"
                                >
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Editar Reporte
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setSelectedReport(null)}
                                    className="border-slate-300 hover:bg-slate-50 px-6 py-2"
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Edición Mejorado */}
            <Dialog
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
            >
                <DialogContent className="sm:max-w-md rounded-xl border-slate-200">
                    <DialogHeader className="border-b border-slate-100 pb-4">
                        <DialogTitle className="text-lg font-semibold text-slate-900">
                            Actualizar Reporte
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 p-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Estado del Reporte
                            </label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger className="w-full border-slate-200 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">Abierto</SelectItem>
                                    <SelectItem value="in_progress">En Progreso</SelectItem>
                                    <SelectItem value="resolved">Resuelto</SelectItem>
                                    <SelectItem value="closed">Cerrado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleUpdate}
                                disabled={updateMutation.isPending}
                                className="bg-black hover:bg-gray-800 text-white"
                            >
                                {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setEditModalOpen(false)}
                                className="border-slate-300 hover:bg-slate-50"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}