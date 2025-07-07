// components/AdsManager.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Calendar, DollarSign, Target, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/csv';
import Button from './ui/Button';

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  start_time?: string;
  stop_time?: string;
}

export default function AdsManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch('/api/marketing/ads');
        const campaigns = await res.json();
        if (!res.ok) {
          setError(campaigns.error || 'Error al cargar campañas');
        } else {
          setCampaigns(campaigns);
        }
      } catch (err) {
        console.error(err);
        setError('Error de red');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const exportCampaigns = () => {
    const formattedCampaigns = campaigns.map(campaign => ({
      ID: campaign.id,
      Nombre: campaign.name,
      Estado: campaign.status,
      Objetivo: campaign.objective || '',
      'Presupuesto Diario': campaign.daily_budget ? `$${(+campaign.daily_budget / 100).toFixed(2)}` : '',
      'Fecha Inicio': campaign.start_time ? new Date(campaign.start_time).toLocaleDateString() : '',
      'Fecha Fin': campaign.stop_time ? new Date(campaign.stop_time).toLocaleDateString() : ''
    }));

    exportToCSV(formattedCampaigns, {
      filename: 'campanas',
      includeTimestamp: true
    });
  }

  if (loading) return <p className="text-gray-500 text-sm">Cargando campañas...</p>;
  if (error) return <p className="text-red-500 text-sm">Error: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Campañas Activas</h2>
        <Button
          onClick={exportCampaigns}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800 truncate flex-1">{campaign.name}</h3>
                {campaign.status.toLowerCase() === 'active' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Target className="w-4 h-4 mr-2" />
                  <span>{campaign.objective || 'Sin objetivo definido'}</span>
                </div>

                {campaign.daily_budget && (
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span>${(+campaign.daily_budget / 100).toFixed(2)}/día</span>
                  </div>
                )}

                {campaign.start_time && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {new Date(campaign.start_time).toLocaleDateString()}
                      {campaign.stop_time && ` - ${new Date(campaign.stop_time).toLocaleDateString()}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">ID: {campaign.id}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay campañas activas.</p>
        </div>
      )}
    </div>
  );
}
