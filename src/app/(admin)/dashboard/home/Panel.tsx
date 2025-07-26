'use client';

import { useEffect, useState } from 'react';

import {
  MessageCircle, Zap, BarChart, Users,
  Activity,
  DollarSign,
  CalendarIcon,
} from 'lucide-react';
import {
  BarChart as Chart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase/client.supabase';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Card, { CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { TooltipContent } from '@radix-ui/react-tooltip';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2 } from 'lucide-react';

export default function Panel() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date }>({ from: new Date(new Date().setMonth(new Date().getMonth() - 1)), to: new Date() });
  // Obtener usuario y su empresa
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .maybeSingle();

      if (profile?.company_id) setCompanyId(profile.company_id);
    })();
  }, []);

  // Queries con react-query
  const { data: totalCampaignsData } = useQuery({
    queryKey: ['totalCampaigns'],
    queryFn: async () => (await fetch('/api/marketing/company/ads?getSummary=true')).json(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: activeCampaignsData } = useQuery({
    queryKey: ['activeCampaigns'],
    queryFn: async () => (await fetch('/api/marketing/company/ads?getSummary=true&filterStatus=ACTIVE')).json(),
    staleTime: 5 * 60 * 1000,
  });


  const { data: totalSpendData, isLoading: isLoadingSpend } = useQuery({
    queryKey: ['totalSpend', dateRange],
    queryFn: async () => {
      const since = dateRange.from.toISOString().split('T')[0];
      const until = dateRange.to?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0];
      const url = `/api/marketing/company/insights?getTotalSpend=true&since=${since}&until=${until}`;
      return (await fetch(url)).json();
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: true,
  });

  const { data: insightsData } = useQuery({
    queryKey: ['recentInsights'],
    queryFn: async () => {
      const res = await fetch('/api/marketing/company/insights?limit=50');
      const json = await res.json();
      return json.data
        .sort((a, b) => new Date(b.dateStop).getTime() - new Date(a.dateStop).getTime())
        .slice(0, 5);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: conversationsData } = useQuery({
    queryKey: ['conversations', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await fetch(`/api/whatsapp/conversations?companyId=${companyId}`);
      return res.json();
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  // Suscripción realtime
  useEffect(() => {
    if (!companyId) return;

    const subscription = supabase
      .channel('contacts:needs_human')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'contacts',
        filter: 'needs_human=eq.true',
      }, (payload) => {
        toast.info('Nuevo contacto requiere atención humana');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [companyId]);

  // Loading state
  if (!companyId || !totalCampaignsData || !activeCampaignsData || !totalSpendData || !insightsData || !conversationsData) {
    return <p className="text-gray-500 text-sm px-4 py-2">Cargando panel...</p>;
  }

  // Procesamiento de datos
  const recentMessages = conversationsData.slice(0, 5).map((c: any) => ({
    phone: c.phone,
    lastMessage: c.lastMessage?.content || '',
    updated_at: c.updated_at,
  }));

  const summary = {
    totalCampaigns: totalCampaignsData.total || 0,
    activeCampaigns: activeCampaignsData.total || 0,
    totalSpend: totalSpendData.totalSpend || 0,
    recentInsights: insightsData.map((i: any) => ({
      campaignName: i.campaignName || 'Desconocida',
      spend: Number(i.spend) || 0,
      clicks: Number(i.clicks) || 0,
      ctr: Number(i.ctr) || 0,
    })),
    recentMessages,
  };
  // Render UI
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-blue-500" /> Campañas Totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{summary.totalCampaigns}</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total de campañas en la cuenta</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-green-500" /> Campañas Activas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{summary.activeCampaigns}</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Número de campañas actualmente activas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-center gap-2 text-lg">
                    <DollarSign className="w-5 h-5 text-red-500" /> Gasto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-center gap-2 text-sm">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Selecciona un rango</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start" side='left'>
                        <Calendar
                          mode="range"
                          defaultMonth={dateRange?.from}
                          numberOfMonths={2}
                          selected={dateRange}
                          onSelect={setDateRange}
                          className="bg-white"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-2xl font-bold flex items-center justify-center gap-2">
                    {summary.totalSpend.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                    {isLoadingSpend && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gasto total en campañas para el período seleccionado</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" /> Últimos Mensajes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.recentMessages.map((m, idx) => (
              <div key={idx} className="border-b pb-2 last:border-0">
                <p className="font-medium text-sm">{m.phone}</p>
                <p className="text-gray-600 text-xs truncate">{m.lastMessage}</p>
                <p className="text-gray-400 text-xs">{new Date(m.updated_at).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" /> Insights Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="text-sm w-full">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left">Campaña</th>
                  <th className="px-4 py-2 text-right">Gasto</th>
                  <th className="px-4 py-2 text-right">Clicks</th>
                  <th className="px-4 py-2 text-right">CTR</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentInsights.map((i, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{i.campaignName}</td>
                    <td className="px-4 py-2 text-right">${i.spend.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{i.clicks}</td>
                    <td className="px-4 py-2 text-right">{i.ctr.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart className="w-5 h-5 text-purple-500" /> Rendimiento de Campañas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <Chart data={summary.recentInsights}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="campaignName" />
              <YAxis yAxisId="left" stroke="#4f46e5" />
              <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
              <RechartsTooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="spend" fill="#4f46e5" name="Gasto" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="clicks" fill="#22c55e" name="Clics" radius={[4, 4, 0, 0]} />
            </Chart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
