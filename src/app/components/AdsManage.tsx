'use client';

import React, { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, Download, Loader2,
} from 'lucide-react';
import { exportToCSV } from '@/lib/utils/csv';
import Button from './ui/Button';
import {
  useInfiniteQuery,
  useQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  start_time?: string;
  stop_time?: string;
}

// 🧠 Crear el QueryClient aquí mismo
const queryClient = new QueryClient();

export default function AdsManagerWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdsManager />
    </QueryClientProvider>
  );
}

function AdsManager() {
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: totalData } = useQuery({
    queryKey: ['totalCampaigns'],
    queryFn: async () => {
      const res = await fetch('/api/marketing/ads?getSummary=true');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error fetching total');
      return json.total || 0;
    },
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['campaigns'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.append('after', pageParam);
      params.append('limit', '25');
      const res = await fetch(`/api/marketing/ads?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al cargar campañas');
      return json;
    },
    getNextPageParam: (lastPage) => lastPage.paging?.cursors?.after || undefined,
    initialPageParam: null,
  });

  const campaigns = data?.pages.flatMap((page) => page.data) || [];

  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter === 'all') return true;
    return c.status.toLowerCase() === statusFilter;
  });

  const loadAllCampaigns = async () => {
    let allCampaigns = [...campaigns];
    let currentCursor = data?.pages[data.pages.length - 1]?.paging?.cursors?.after;
    while (currentCursor) {
      const params = new URLSearchParams({ after: currentCursor, limit: '25' });
      const res = await fetch(`/api/marketing/ads?${params.toString()}`);
      const json = await res.json();
      allCampaigns = [...allCampaigns, ...json.data];
      currentCursor = json.paging?.cursors?.after || null;
    }
    return allCampaigns;
  };

  const exportCampaigns = async () => {
    try {
      let exportData = campaigns;
      if (hasNextPage) {
        exportData = await loadAllCampaigns();
      }
      if (!exportData.length) return;

      const formatted = exportData.map(c => ({
        ID: c.id,
        Nombre: c.name,
        Estado: c.status,
        Objetivo: c.objective || '',
        'Presupuesto Diario': c.daily_budget ? `$${(+c.daily_budget / 100).toFixed(2)}` : '',
        'Fecha Inicio': c.start_time ? new Date(c.start_time).toLocaleDateString() : '',
        'Fecha Fin': c.stop_time ? new Date(c.stop_time).toLocaleDateString() : ''
      }));

      exportToCSV(formatted, { filename: 'campanas', includeTimestamp: true });
    } catch (err) {
      console.error('Error exporting:', err);
      setError('Error al exportar CSV');
    }
  };

  if (isLoading) return <p className="text-gray-500 text-sm">Cargando campañas...</p>;
  if (error) return <p className="text-red-500 text-sm">Error: {error}</p>;

  return (
    <div>
      {/* Filtros y exportar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Campañas</h2>
          {campaigns.length > 0 && (
            <p className="text-sm text-gray-500">
              Mostrando {filteredCampaigns.length} de {totalData || 0} campañas
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as 'all' | 'active' | 'inactive')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          {campaigns.length > 0 && (
            <Button
              onClick={exportCampaigns}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de campañas */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead>Presupuesto Diario</TableHead>
              <TableHead>Fecha Inicio</TableHead>
              <TableHead>Fecha Fin</TableHead>
              <TableHead>ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>{campaign.name}</TableCell>
                <TableCell className="flex items-center gap-2">
                  {campaign.status.toLowerCase() === 'active' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  {campaign.status}
                </TableCell>
                <TableCell>{campaign.objective || 'Sin objetivo definido'}</TableCell>
                <TableCell>
                  {campaign.daily_budget ? `$${(+campaign.daily_budget / 100).toFixed(2)}/día` : ''}
                </TableCell>
                <TableCell>{campaign.start_time ? new Date(campaign.start_time).toLocaleDateString() : ''}</TableCell>
                <TableCell>{campaign.stop_time ? new Date(campaign.stop_time).toLocaleDateString() : ''}</TableCell>
                <TableCell>{campaign.id}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Botón cargar más */}
      {hasNextPage && (
        <div className="mt-4 text-center">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Cargando más...
              </>
            ) : (
              'Cargar más campañas'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}