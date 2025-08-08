'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Building2, Plus, Trash2, RefreshCw, CheckCircle2, Users, Eye, RotateCcw } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import RegisterCompanyForm from './RegisterCompanyForm';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

type Admin = {
  id: string;
  email: string;
};

type Company = {
  id: string;
  name: string;
  whatsapp_number: string;
  created_at: string;
  is_active: boolean;
  admins: Admin[];
};

export default function CompaniesManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showRegisterForm, setShowRegisterForm] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyAssistants, setCompanyAssistants] = useState<any[]>([]);
  const [showCompanyModal, setShowCompanyModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/superadmin/list-companies');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al obtener las empresas');
        }

        setCompanies(data.companies || []);
      } catch (error) {
        console.error('Error al obtener las empresas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

const handleDeleteCompany = async (companyId: string) => {
  const company = companies.find(c => c.id === companyId);
  if (!company) return;

  const isActive = company.is_active;
  const action = isActive ? 'desactiva' : 'activa';
  const actionLabel = isActive ? 'Desactivar' : 'Activar';
  
  toast(`¿Estás seguro de que quieres ${action}r esta empresa?${isActive ? '\n\nNota: Todos los usuarios de esta empresa serán desconectados inmediatamente.' : ''}`, {
    duration: Infinity,
    action: {
      label: actionLabel,
      onClick: async () => {
        try {
          const response = await fetch(`/api/superadmin/delete-company?id=${companyId}`, {
            method: isActive ? 'DELETE' : 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const data = await response.json();

          if (!response.ok) {
            toast.error(data.error || `Error al ${action}r la empresa`);
            return;
          }

          const successMessage = isActive 
            ? `Empresa ${action}da correctamente. ${data.usersTerminated || 0} sesiones cerradas.`
            : `Empresa ${action}da correctamente`;
          
          toast.success(successMessage);
          handleRefresh();
        } catch (error) {
          toast.error(`Error al ${action}r la empresa`);
        }
      }
    },
    cancel: {
      label: 'Cancelar',
      onClick: () => {
        toast.dismiss();
      }
    }
  });
};

  const handleViewCompanyDetails = async (company: Company) => {
    setSelectedCompany(company);
    try {
      const response = await fetch(`/api/superadmin/company/${company.id}/assistants`);
      const data = await response.json();
      if (response.ok) {
        setCompanyAssistants(data.assistants || []);
      }
    } catch (error) {
      console.error('Error al obtener asistentes:', error);
    }
    setShowCompanyModal(true);
  };

  const toggleAssistantStatus = async (assistantId: string, currentStatus: boolean, isDeleted: boolean) => {
    try {
      const response = await fetch(`/api/superadmin/assistants/${assistantId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isDeleted ? true : !currentStatus })
      });
  
      if (response.ok) {
        const message = isDeleted 
          ? 'Asistente reactivado correctamente' 
          : `Asistente ${!currentStatus ? 'activado' : 'desactivado'} correctamente`;
        
        toast.success(message);
        
        // Actualizar la lista
        const updatedResponse = await fetch(`/api/superadmin/company/${selectedCompany?.id}/assistants`);
        const data = await updatedResponse.json();
        setCompanyAssistants(data.assistants || []);
        handleRefresh();
      } else {
        toast.error('Error al actualizar el asistente');
      }
    } catch (error) {
      toast.error('Error al actualizar el asistente');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Empresas</h1>
          <p className="text-gray-500">Administra las empresas registradas en la plataforma</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex cursor-pointer items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button
            onClick={() => setShowRegisterForm(true)}
            className="flex cursor-pointer items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Empresa
          </Button>
        </div>
      </div>

      {showRegisterForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Registrar Nueva Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <RegisterCompanyForm
              onSuccessAction={() => {
                setShowRegisterForm(false);
                handleRefresh();
              }}
              onCancelAction={() => setShowRegisterForm(false)}
            />
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Empresas Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay empresas registradas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Información de la Empresa</th>
                      <th className="text-left py-3 px-4">Asistentes</th>
                      <th className="text-left py-3 px-4">Fecha de Creación</th>
                      <th className="text-left py-3 px-4">Estado</th>
                      <th className="text-right py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company: any) => (
                      <tr key={company.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium">{company.name}</div>
                              <div className="text-sm text-gray-500">
                                WhatsApp: {company.whatsapp_number || 'No configurado'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Admins: {company.admins?.length ? company.admins.map(admin => admin.email).join(', ') : 'Sin administradores'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="text-sm font-medium">{company.stats?.activeAssistants || 0} activos</div>
                              <div className="text-xs text-gray-500">
                                {company.stats?.totalAssistants || 0} total
                                {company.stats?.deletedAssistants > 0 && (
                                  <span className="text-orange-600 ml-1">
                                    ({company.stats?.deletedAssistants} eliminados)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{formatDate(company.created_at)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={company.is_active ? "default" : "destructive"}>
                            {company.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="cursor-pointer text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleViewCompanyDetails(company)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`cursor-pointer ${
                                company.is_active 
                                  ? 'text-red-500 hover:text-red-700 hover:bg-red-50' 
                                  : 'text-green-500 hover:text-green-700 hover:bg-green-50'
                              }`}
                              onClick={() => handleDeleteCompany(company.id)}
                            >
                              {company.is_active ? <Trash2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de gestión de empresa */}
      <Dialog open={showCompanyModal} onOpenChange={setShowCompanyModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Gestión de Empresa: {selectedCompany?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Información de la empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre</label>
                    <p>{selectedCompany?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">WhatsApp</label>
                    <p>{selectedCompany?.whatsapp_number || 'No configurado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Estado</label>
                    <div>
                      <Badge variant={selectedCompany?.is_active ? "default" : "destructive"}>
                        {selectedCompany?.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Fecha de creación</label>
                    <p>{selectedCompany && formatDate(selectedCompany.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Administradores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Administradores ({selectedCompany?.admins?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedCompany?.admins?.map((admin: any) => (
                    <div key={admin.id} className="flex items-center justify-between p-2 border rounded">
                      <span>{admin.email}</span>
                      <Badge variant={admin.is_active ? "default" : "secondary"}>
                        {admin.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Asistentes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestión de Asistentes ({companyAssistants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companyAssistants.map(assistant => (
                    <div key={assistant.id} className={`flex items-center justify-between p-3 border rounded-lg ${
                      assistant.deleted_at ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                    }`}>
                      <div className="flex-1">
                        <div className="font-medium">{assistant.email}</div>
                        <div className="text-sm text-gray-500">
                          Creado: {formatDate(assistant.created_at)}
                          {assistant.deleted_at && (
                            <span className="text-orange-600 ml-2 font-medium">
                              Eliminado: {formatDate(assistant.deleted_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {assistant.deleted_at ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50 cursor-pointer"
                            onClick={() => toggleAssistantStatus(assistant.id, assistant.is_active, true)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reactivar
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={assistant.is_active}
                              onCheckedChange={() => toggleAssistantStatus(assistant.id, assistant.is_active, false)}
                            />
                            <span className="text-sm">
                              {assistant.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}