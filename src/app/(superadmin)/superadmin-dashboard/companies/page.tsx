'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Building2, Plus, Trash2, RefreshCw } from 'lucide-react';
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
  toast('¿Estás seguro de que quieres eliminar esta empresa?', {
    duration: Infinity,
    action: {
      label: 'Eliminar',
      onClick: async () => {
        try {
          const response = await fetch('/api/superadmin/delete-company', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ companyId }),
          });
          
          const data = await response.json();


          if (!response.ok) {
            toast.error(data.error || 'Error al eliminar la empresa');
            return;
          }

          toast.success('Empresa eliminada correctamente');
          handleRefresh();
        } catch (error) {
          toast.error('Error al eliminar la empresa');
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
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="cursor-pointer text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteCompany(company.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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