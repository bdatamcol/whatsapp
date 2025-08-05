'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { BarChart3, Users, MessageCircle, Building2, TrendingUp, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalUsers: number;
  totalContacts: number;
  totalMessages: number;
  recentCompanies: Array<{
    id: string;
    name: string;
    created_at: string;
    is_active: boolean;
    admin_count: number;
  }>;
}

export default function SuperAdminAnalytics() {
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['superadmin-analytics-detailed'],
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

  const handleExport = () => {
    if (!analytics) return;
    
    const data = {
      fecha: new Date().toISOString(),
      resumen: {
        totalEmpresas: analytics.totalCompanies,
        empresasActivas: analytics.activeCompanies,
        empresasInactivas: analytics.inactiveCompanies,
        totalUsuarios: analytics.totalUsers,
        totalContactos: analytics.totalContacts,
        totalConversaciones: analytics.totalMessages,
      },
      empresasRecientes: analytics.recentCompanies,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-superadmin-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Análisis y Reportes</h1>
            <p className="text-gray-500 mt-1">Métricas detalladas del sistema</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Análisis y Reportes</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-500">Error al cargar los datos: {(error as Error).message}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Análisis y Reportes</h1>
          <p className="text-gray-500 mt-1">Métricas detalladas del sistema</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar Datos
        </Button>
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
            <div className="text-3xl font-bold">{analytics?.totalCompanies || 0}</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Activas
                </span>
                <span className="font-medium">{analytics?.activeCompanies || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600 flex items-center">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Inactivas
                </span>
                <span className="font-medium">{analytics?.inactiveCompanies || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Usuarios del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.totalUsers || 0}</div>
            <p className="text-xs text-gray-500 mt-2">Administradores y asistentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contactos Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.totalContacts || 0}</div>
            <p className="text-xs text-gray-500 mt-2">Todos los contactos del sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Total de Interacciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.totalMessages || 0}</div>
            <p className="text-xs text-gray-500 mt-2">Conversaciones registradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución de empresas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado de las Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Porcentaje de activas</span>
                <span className="text-lg font-bold text-green-600">
                  {analytics?.totalCompanies > 0 
                    ? Math.round((analytics.activeCompanies / analytics.totalCompanies) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ 
                    width: `${analytics?.totalCompanies > 0 
                      ? (analytics.activeCompanies / analytics.totalCompanies) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Empresas Más Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.recentCompanies?.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{company.name}</p>
                    <p className="text-xs text-gray-500">
                      Creada: {new Date(company.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {company.admin_count} admin{company.admin_count !== 1 ? 's' : ''}
                    </span>
                    {company.is_active ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Activa
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                        Inactiva
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}