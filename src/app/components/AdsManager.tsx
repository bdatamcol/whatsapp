'use client';

import React, { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, Download, Loader2, Calendar, Eye, MousePointerClick, Wallet, Users, ChevronDown, ChevronUp,
} from 'lucide-react';
import { exportToCSV } from '@/lib/utils/csv';
import Button from './ui/Button';
import {
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { FacebookConfigError } from './FacebookConfigError';

export default function AdsManager() {
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedAdForLeads, setSelectedAdForLeads] = useState<string | null>(null);

  const { data: totalData, error: totalError } = useQuery({
    queryKey: ['totalCampaigns'],
    queryFn: async () => {
      const res = await fetch('/api/marketing/company/ads?getSummary=true');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error fetching total');
      return json;
    },
  });

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
    setAppliedDateRange(newDateRange);
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error: campaignsError,
  } = useInfiniteQuery({
    queryKey: ['campaigns', appliedDateRange],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.append('after', pageParam);
      params.append('limit', '25');

      // Agregar filtros de fecha si están definidos
      if (appliedDateRange?.from) {
        params.append('since', appliedDateRange.from.toISOString().split('T')[0]);
      }
      if (appliedDateRange?.to) {
        params.append('until', appliedDateRange.to.toISOString().split('T')[0]);
      }

      // const res = await fetch(`/api/marketing/company/ads?\${params.toString()}`);
      const res = await fetch(`/api/marketing/company/ads?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al cargar campañas');
      return json;
    },
    getNextPageParam: (lastPage) => lastPage.paging?.cursors?.after || undefined,
    initialPageParam: null,
  });

  const { data: selectedCampaignDetails, isLoading: isLoadingCampaignDetails } = useQuery({
    queryKey: ['campaign-details', selectedCampaignId, appliedDateRange?.from?.toISOString(), appliedDateRange?.to?.toISOString()],
    queryFn: async () => {
      if (!selectedCampaignId) return null;
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (appliedDateRange?.from) {
        params.append('since', appliedDateRange.from.toISOString().split('T')[0]);
      }
      if (appliedDateRange?.to) {
        params.append('until', appliedDateRange.to.toISOString().split('T')[0]);
      }

      const res = await fetch(`/api/marketing/company/campaigns/${selectedCampaignId}/details?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error cargando detalle de campaña');
      return json;
    },
    enabled: !!selectedCampaignId,
  });

  const { data: adLeadsData, isLoading: isLoadingAdLeads } = useQuery({
    queryKey: ['ad-leads', selectedAdForLeads],
    queryFn: async () => {
      if (!selectedAdForLeads) return { data: [] };
      const res = await fetch(`/api/marketing/company/ads/${selectedAdForLeads}/leads?limit=100`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error cargando leads del anuncio');
      return json;
    },
    enabled: !!selectedAdForLeads,
  });

  // const campaigns = data?.pages.flatMap((page) => page.data) || [];
  const uniqueCampaigns = React.useMemo(() => {
    const all = data?.pages.flatMap((page) => page.data) || [];
    return Array.from(new Map(all.map(c => [c.id, c])).values());
  }, [data]);



  const getCurrentStatus = (campaign: any) => {
    const baseStatus = (campaign.effective_status || campaign.status || '').toUpperCase();
    if (!baseStatus) return 'UNKNOWN';

    const now = new Date();
    const start = campaign.start_time ? new Date(campaign.start_time) : null;
    const stop = campaign.stop_time ? new Date(campaign.stop_time) : null;

    const hasStarted = !start || start <= now;
    const notEnded = !stop || stop >= now;

    if (baseStatus === 'ACTIVE' && hasStarted && notEnded) {
      return 'ACTIVE';
    }

    if (baseStatus === 'ACTIVE' && stop && stop < now) {
      return 'COMPLETED';
    }

    return baseStatus;
  };

  const filteredCampaigns = uniqueCampaigns.filter((c) => {
    if (statusFilter === 'all') return true;
    const currentStatus = getCurrentStatus(c);
    if (statusFilter === 'active') return currentStatus === 'ACTIVE';
    return currentStatus !== 'ACTIVE';
  });

  const sortedCampaigns = React.useMemo(() => {
    const statusWeight = (campaign: any) => {
      const status = getCurrentStatus(campaign);
      if (status === 'ACTIVE') return 3;
      if (status === 'COMPLETED') return 2;
      return 1;
    };

    return [...filteredCampaigns].sort((a, b) => {
      const weightDiff = statusWeight(b) - statusWeight(a);
      if (weightDiff !== 0) return weightDiff;

      const startA = a.start_time ? new Date(a.start_time).getTime() : 0;
      const startB = b.start_time ? new Date(b.start_time).getTime() : 0;
      return startB - startA;
    });
  }, [filteredCampaigns]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value || 0);

  const formatNumber = (value: number) => new Intl.NumberFormat('es-CO').format(value || 0);

  const toggleCampaignDetails = (campaignId: string) => {
    setSelectedCampaignId((current) => (current === campaignId ? null : campaignId));
    setSelectedAdForLeads(null);
  };

  const toggleAdLeads = (adId: string) => {
    setSelectedAdForLeads((current) => (current === adId ? null : adId));
  };

  const getAdPriority = (ad: any) => {
    const status = String(ad.effective_status || ad.status || '').toUpperCase();
    const impressions = Number(ad.metrics?.impressions || 0);
    const clicks = Number(ad.metrics?.clicks || 0);
    const spend = Number(ad.metrics?.spend || 0);
    const hasDelivery = impressions > 0 || clicks > 0 || spend > 0;

    if (status === 'ACTIVE' && hasDelivery) return 3;
    if (status === 'ACTIVE') return 2;
    return 1;
  };

  const sortedAds = React.useMemo(() => {
    const ads = selectedCampaignDetails?.ads || [];
    return [...ads].sort((a: any, b: any) => {
      const priorityDiff = getAdPriority(b) - getAdPriority(a);
      if (priorityDiff !== 0) return priorityDiff;

      const spendDiff = Number(b.metrics?.spend || 0) - Number(a.metrics?.spend || 0);
      if (spendDiff !== 0) return spendDiff;

      return Number(b.metrics?.impressions || 0) - Number(a.metrics?.impressions || 0);
    });
  }, [selectedCampaignDetails]);

  const activeDeliveringAdsCount = React.useMemo(
    () => sortedAds.filter((ad: any) => getAdPriority(ad) === 3).length,
    [sortedAds]
  );

  const getLeadField = (lead: any, fieldNames: string[]): string => {
    const fields = Array.isArray(lead?.field_data) ? lead.field_data : [];
    for (const field of fields) {
      const name = String(field?.name || '').toLowerCase();
      if (fieldNames.some((f) => name.includes(f))) {
        const values = Array.isArray(field?.values) ? field.values : [];
        if (values.length > 0) return String(values[0]);
      }
    }
    return '-';
  };


  // Check for Facebook configuration error
  const isFacebookConfigError = totalError?.message?.includes('configuración de Facebook completa') ||
    campaignsError?.message?.includes('configuración de Facebook completa');

  if (isFacebookConfigError) {
    return (
      <FacebookConfigError
        title="Configuración de Facebook incompleta"
        message="Para ver tus campañas de Facebook Ads, necesitas completar la configuración de Facebook Ads en la sección de ajustes."
      />
    );
  }

  const loadAllCampaigns = async () => {
    let allCampaigns: any[] = [];

    let currentCursor =
      data?.pages[data.pages.length - 1]?.paging?.cursors?.after;

    while (currentCursor) {
      const params = new URLSearchParams({ after: currentCursor, limit: '25' });
      const res = await fetch(`/api/marketing/company/ads?${params.toString()}`);
      const json = await res.json();

      allCampaigns.push(...json.data);

      currentCursor = json.paging?.cursors?.after || null;
    }

    // deduplicar AL FINAL
    allCampaigns = Array.from(
      new Map(allCampaigns.map(c => [c.id, c])).values()
    );

    return allCampaigns;

  };

  const exportCampaigns = async () => {
    try {
      let exportData = filteredCampaigns;
      if (hasNextPage) {
        exportData = await loadAllCampaigns();
      }
      if (!exportData.length) return;

      const formatted = exportData.map(c => ({
        ID: c.id,
        Nombre: c.name,
        Estado: getCurrentStatus(c),
        'Estado Meta': (c.effective_status || c.status || '').toUpperCase(),
        Objetivo: c.objective || '',
        'Presupuesto Diario': c.daily_budget ? `${(+c.daily_budget / 100).toFixed(2)}` : '',
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
          {filteredCampaigns.length > 0 && (
            <p className="text-sm text-gray-500">
            Mostrando {sortedCampaigns.length} de {totalData?.total || 0} campañas
              {appliedDateRange?.from && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                  Filtrado por fecha
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <DatePickerWithRange
              date={dateRange}
              onDateChange={handleDateRangeChange}
              className="w-[300px]"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as 'all' | 'active' | 'inactive')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activo (vigente)</SelectItem>
              <SelectItem value="inactive">No activo</SelectItem>
            </SelectContent>
          </Select>
          {filteredCampaigns.length > 0 && (
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
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCampaigns.map((campaign) => (
              <React.Fragment key={campaign.id}>
                <TableRow>
                  <TableCell>{campaign.name}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {getCurrentStatus(campaign) === 'ACTIVE' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                    {getCurrentStatus(campaign)}
                  </TableCell>
                  <TableCell>{campaign.objective || 'Sin objetivo definido'}</TableCell>
                  <TableCell>
                    {campaign.daily_budget ? `${(+campaign.daily_budget / 100).toFixed(2)}/día` : ''}
                  </TableCell>
                  <TableCell>{campaign.start_time ? new Date(campaign.start_time).toLocaleDateString() : ''}</TableCell>
                  <TableCell>{campaign.stop_time ? new Date(campaign.stop_time).toLocaleDateString() : ''}</TableCell>
                  <TableCell>{campaign.id}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleCampaignDetails(campaign.id)}
                      className="flex items-center gap-1"
                    >
                      {selectedCampaignId === campaign.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {selectedCampaignId === campaign.id ? 'Ocultar' : 'Ver detalle'}
                    </Button>
                  </TableCell>
                </TableRow>

                {selectedCampaignId === campaign.id && (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-slate-50">
                      {isLoadingCampaignDetails ? (
                        <div className="py-6 text-center text-gray-500 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cargando detalle de campana...
                        </div>
                      ) : (
                        <div className="space-y-4 py-2">
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                            <div className="rounded-lg border bg-white p-3">
                              <div className="text-xs text-gray-500 flex items-center gap-1"><Wallet className="w-3 h-3" /> Gasto</div>
                              <div className="text-sm font-semibold">{formatCurrency(selectedCampaignDetails?.insights?.spend || 0)}</div>
                            </div>
                            <div className="rounded-lg border bg-white p-3">
                              <div className="text-xs text-gray-500 flex items-center gap-1"><Eye className="w-3 h-3" /> Impresiones</div>
                              <div className="text-sm font-semibold">{formatNumber(selectedCampaignDetails?.insights?.impressions || 0)}</div>
                            </div>
                            <div className="rounded-lg border bg-white p-3">
                              <div className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-3 h-3" /> Alcance</div>
                              <div className="text-sm font-semibold">{formatNumber(selectedCampaignDetails?.insights?.reach || 0)}</div>
                            </div>
                            <div className="rounded-lg border bg-white p-3">
                              <div className="text-xs text-gray-500 flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> Clicks</div>
                              <div className="text-sm font-semibold">{formatNumber(selectedCampaignDetails?.insights?.clicks || 0)}</div>
                            </div>
                            <div className="rounded-lg border bg-white p-3">
                              <div className="text-xs text-gray-500">CTR</div>
                              <div className="text-sm font-semibold">{Number(selectedCampaignDetails?.insights?.ctr || 0).toFixed(2)}%</div>
                            </div>
                            <div className="rounded-lg border bg-white p-3">
                              <div className="text-xs text-gray-500">CPC</div>
                              <div className="text-sm font-semibold">{formatCurrency(selectedCampaignDetails?.insights?.cpc || 0)}</div>
                            </div>
                            <div className="rounded-lg border bg-white p-3">
                              <div className="text-xs text-gray-500">Leads</div>
                              <div className="text-sm font-semibold">{formatNumber(selectedCampaignDetails?.insights?.leads || 0)}</div>
                            </div>
                          </div>

                          <div className="rounded-lg border bg-white">
                            <div className="px-4 py-3 border-b flex items-center justify-between">
                              <h4 className="font-semibold text-sm">Anuncios de la campana ({selectedCampaignDetails?.totalAds || 0})</h4>
                              <span className="text-xs text-gray-500">Activos con entrega: {activeDeliveringAdsCount} | Activos: {selectedCampaignDetails?.activeAds || 0}</span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-left border-b bg-gray-50">
                                    <th className="px-4 py-2">Anuncio</th>
                                    <th className="px-4 py-2">Estado</th>
                                    <th className="px-4 py-2">Impresiones</th>
                                    <th className="px-4 py-2">Clicks</th>
                                    <th className="px-4 py-2">CTR</th>
                                    <th className="px-4 py-2">Gasto</th>
                                    <th className="px-4 py-2">Leads</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sortedAds.length === 0 && (
                                    <tr>
                                      <td colSpan={7} className="px-4 py-4 text-gray-500 text-center">No se encontraron anuncios para esta campana.</td>
                                    </tr>
                                  )}
                                  {sortedAds.map((ad: any) => {
                                    const adStatus = String(ad.effective_status || ad.status || '').toUpperCase();
                                    const isAdExpanded = selectedAdForLeads === ad.id;
                                    const insightLeads = Number(ad.metrics?.leads || 0);
                                    const realLeads = Array.isArray(adLeadsData?.data) ? adLeadsData.data.length : 0;
                                    return (
                                      <React.Fragment key={ad.id}>
                                        <tr className="border-b">
                                          <td className="px-4 py-2 font-medium">{ad.name}</td>
                                          <td className="px-4 py-2">{adStatus}</td>
                                          <td className="px-4 py-2">{formatNumber(ad.metrics?.impressions || 0)}</td>
                                          <td className="px-4 py-2">{formatNumber(ad.metrics?.clicks || 0)}</td>
                                          <td className="px-4 py-2">{Number(ad.metrics?.ctr || 0).toFixed(2)}%</td>
                                          <td className="px-4 py-2">{formatCurrency(ad.metrics?.spend || 0)}</td>
                                          <td className="px-4 py-2">
                                            <button
                                              type="button"
                                              onClick={() => toggleAdLeads(ad.id)}
                                              className="text-blue-700 hover:text-blue-900 underline font-medium"
                                            >
                                              {formatNumber(insightLeads)} ver leads
                                            </button>
                                          </td>
                                        </tr>

                                        {isAdExpanded && (
                                          <tr className="border-b bg-slate-100">
                                            <td colSpan={7} className="px-4 py-3">
                                              {isLoadingAdLeads ? (
                                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                  Cargando leads reales del anuncio...
                                                </div>
                                              ) : (
                                                <div className="space-y-3">
                                                  <div className="text-sm text-gray-700">
                                                    Leads reales del formulario: <span className="font-semibold">{formatNumber(realLeads)}</span>
                                                    {insightLeads !== realLeads && (
                                                      <span className="ml-2 text-xs text-amber-700">
                                                        (Meta Insights reporta {formatNumber(insightLeads)} por atribucion)
                                                      </span>
                                                    )}
                                                  </div>

                                                  {realLeads === 0 ? (
                                                    <div className="text-sm text-gray-600">
                                                      No hay leads descargables para este anuncio en este momento.
                                                    </div>
                                                  ) : (
                                                    <div className="overflow-x-auto rounded border bg-white">
                                                      <table className="min-w-full text-sm">
                                                        <thead>
                                                          <tr className="text-left border-b bg-gray-50">
                                                            <th className="px-3 py-2">Fecha</th>
                                                            <th className="px-3 py-2">Nombre</th>
                                                            <th className="px-3 py-2">Telefono</th>
                                                            <th className="px-3 py-2">Email</th>
                                                            <th className="px-3 py-2">Lead ID</th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {adLeadsData.data.map((lead: any) => (
                                                            <tr key={lead.id} className="border-b">
                                                              <td className="px-3 py-2 whitespace-nowrap">
                                                                {lead.created_time ? new Date(lead.created_time).toLocaleString() : '-'}
                                                              </td>
                                                              <td className="px-3 py-2">{getLeadField(lead, ['full_name', 'nombre', 'name'])}</td>
                                                              <td className="px-3 py-2">{getLeadField(lead, ['phone', 'telefono', 'celular', 'mobile'])}</td>
                                                              <td className="px-3 py-2">{getLeadField(lead, ['email', 'correo'])}</td>
                                                              <td className="px-3 py-2 font-mono text-xs">{lead.id}</td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </table>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
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
