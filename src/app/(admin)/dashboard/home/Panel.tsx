'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { MessageCircle, BarChart, Zap } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { supabase } from '@/lib/supabase/client.supabase';
import { toast } from 'sonner';

export default function Dashboard() {
  const [summary, setSummary] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSpend: 0,
    recentMessages: [],
    recentInsights: [],
    recentConversations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const user = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.data.user?.id)
        .maybeSingle();

      const companyId = profile?.company_id;

      try {
        const [adsRes, insightsRes, conversationsRes] = await Promise.all([
          fetch('/api/marketing/ads'),
          fetch('/api/marketing/insights?limit=5'),
          fetch(`/api/whatsapp/conversations?companyId=${companyId}`),
        ]);

        const [ads, insights, conversations] = await Promise.all([
          adsRes.json(),
          insightsRes.json(),
          conversationsRes.json(),
        ]);

        const activeCampaigns = ads.filter((c: any) => c.status === 'ACTIVE');
        const totalSpend = insights.data.reduce(
          (sum: number, metric: any) => sum + (Number(metric.spend) || 0),
          0
        );

        setSummary({
          totalCampaigns: ads.length,
          activeCampaigns: activeCampaigns.length,
          totalSpend,
          recentMessages: conversations.slice(0, 5).map((c: any) => ({
            phone: c.phone,
            lastMessage: c.lastMessage?.content || '',
            updated_at: c.updated_at,
          })),
          recentInsights: insights.data.map((i: any) => ({
            ...i,
            spend: Number(i.spend) || 0,
            clicks: Number(i.clicks) || 0,
            ctr: Number(i.ctr) || 0,
          })),
          recentConversations: conversations.slice(0, 5),
        });
      } catch (err) {
        console.error('Error al cargar el dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // Subscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('contacts:needs_human')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contacts',
          filter: 'needs_human=eq.true',
        },
        (payload) => {
          toast.info('Hay nuevos contactos que necesitan atención humana.') // Activar la alerta visual
        }
      )
      .subscribe();

    // Limpiar suscripción cuando se desmonta
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) return <p className="text-gray-500 text-sm">Cargando panel...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {/* Campañas */}
      <Card className="text-center">
        <CardContent>
          <p className="text-gray-500 text-sm">Campañas Totales</p>
          <p className="text-lg font-bold">{summary.totalCampaigns}</p>
        </CardContent>
      </Card>
      <Card className="text-center">
        <CardContent>
          <p className="text-gray-500 text-sm">Campañas Activas</p>
          <p className="text-lg font-bold">{summary.activeCampaigns}</p>
        </CardContent>
      </Card>
      <Card className="text-center">
        <CardContent>
          <p className="text-gray-500 text-sm">Gasto Total</p>
          <p className="text-lg font-bold">${summary.totalSpend.toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* Últimos Mensajes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            Últimos Mensajes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {summary.recentMessages.map((m, idx) => (
            <div key={idx} className="border-b pb-1">
              <p className="font-medium">{m.phone}</p>
              <p className="text-gray-600 truncate">{m.lastMessage}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Insights recientes */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Insights Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="text-sm w-full text-left">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2">Campaña</th>
                <th className="px-3 py-2">Gasto</th>
                <th className="px-3 py-2">Clicks</th>
                <th className="px-3 py-2">CTR</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentInsights.map((i: any, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-3 py-2">{i.campaignName}</td>
                  <td className="px-3 py-2">${i.spend}</td>
                  <td className="px-3 py-2">{i.clicks}</td>
                  <td className="px-3 py-2">{i.ctr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {/* rendimiento de campañas */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-purple-500" />
            Rendimiento de Campañas (Gasto vs Clics)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={summary.recentInsights}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="campaignName" />

              {/* Eje Y para el gasto */}
              <YAxis yAxisId="left" orientation="left" />

              {/* Eje Y para los clics */}
              <YAxis yAxisId="right" orientation="right" />

              <Tooltip />
              <Legend />

              {/* Línea de gasto en el eje izquierdo */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spend"
                stroke="#4f46e5"
                name="Gasto"
              />

              {/* Línea de clics en el eje derecho */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="clicks"
                stroke="#22c55e"
                name="Clics"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
