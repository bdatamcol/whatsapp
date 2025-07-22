'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { data: companiesData, isLoading } = useQuery({
    queryKey: ['companies-count'],
    queryFn: async () => {
      const response = await fetch('/api/superadmin/list-companies');
      if (!response.ok) {
        throw new Error('Error al obtener las empresas');
      }
      const data = await response.json();
      return data.companies;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos antes de considerar los datos obsoletos
    gcTime: 30 * 60 * 1000, // Mantener en caché por 30 minutos
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Panel de SuperAdmin</h1>
      <p className="text-gray-500">Bienvenido al panel de control de SuperAdmin</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span className="text-2xl font-bold">
                {isLoading ? '...' : companiesData?.length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            onClick={() => router.push('/superadmin-dashboard/companies')}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-all flex items-center space-x-3"
          >
            <Building2 className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="font-medium">Gestionar Empresas</h3>
              <p className="text-sm text-gray-500">Crear, editar y administrar empresas</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}