'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Building2, Users, MessageCircle, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BugReportButton from '@/app/components/bug-reports/BugReportButton';
import { Bug } from 'lucide-react';

export default function SuperAdminDashboard() {
  const router = useRouter();

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['superadmin-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/superadmin/analytics');
      if (!response.ok) {
        throw new Error('Error al obtener analytics');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Panel de SuperAdmin</h1>
          <p className="text-gray-500 mt-1">Bienvenido al panel de control de SuperAdmin</p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Total de Empresas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingAnalytics ? '...' : analytics?.totalCompanies || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics?.activeCompanies || 0} activas · {analytics?.inactiveCompanies || 0} inactivas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingAnalytics ? '...' : analytics?.totalUsers || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Administradores y asistentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contactos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingAnalytics ? '...' : analytics?.totalContacts || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Todos los contactos del sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Conversaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingAnalytics ? '...' : analytics?.totalMessages || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total de interacciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empresas recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Empresas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics?.recentCompanies?.map((company: any) => (
                  <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{company.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(company.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {company.admin_count} admins
                      </span>
                      {company.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/superadmin-dashboard/companies')}
                className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all flex items-center space-x-3 text-left"
              >
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-sm">Gestionar Empresas</h3>
                  <p className="text-xs text-gray-600">Crear, editar y administrar empresas</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/superadmin-dashboard/analytics')}
                className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-all flex items-center space-x-3 text-left"
              >
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-sm">Ver Reportes</h3>
                  <p className="text-xs text-gray-600">Análisis detallado del sistema</p>
                </div>
              </button>
              <button
                onClick={() => router.push('/superadmin-dashboard/bug-reports')}
                className="w-full p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-all flex items-center space-x-3 text-left"
              >
                <Bug className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-medium text-sm">Ver Reportes de Bugs</h3>
                  <p className="text-xs text-gray-600">Administrar problemas reportados</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
      <BugReportButton
        variant="floating"
        position="bottom-right"
        label="Reportar Bug"
      />
    </div>
  );
}