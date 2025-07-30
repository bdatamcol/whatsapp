'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Building2, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import RegisterCompanyForm from './RegisterCompanyForm';
import { toast } from 'sonner';

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
                      <th className="text-left py-3 px-4">Fecha de Creación</th>
                      <th className="text-left py-3 px-4">Estado</th>
                      <th className="text-right py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          <div>
                            <div>{company.name}</div>
                            <div className="text-sm text-gray-500">
                              WhatsApp: {company.whatsapp_number || 'No configurado'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Admins: {company.admins?.length ? company.admins.map(admin => admin.email).join(', ') : 'Sin administradores'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{formatDate(company.created_at)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            company.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {company.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
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
    </div>
  );
}