// components/AdsManager.tsx
'use client';

import React, { useEffect, useState } from 'react';

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
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Error al cargar campañas');
        } else {
          setCampaigns(data.campaigns);
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

  if (loading) return <p className="text-gray-500 text-sm">Cargando campañas...</p>;
  if (error) return <p className="text-red-500 text-sm">Error: {error}</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Campañas Activas</h2>
      <div className="space-y-4">
        {campaigns.length > 0 ? (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="border p-4 rounded-lg">
              <p><strong>Nombre:</strong> {campaign.name}</p>
              <p><strong>ID:</strong> {campaign.id}</p>
              <p><strong>Estado:</strong> {campaign.status}</p>
              {campaign.objective && <p><strong>Objetivo:</strong> {campaign.objective}</p>}
              {campaign.daily_budget && <p><strong>Presupuesto Diario:</strong> ${(+campaign.daily_budget / 100).toFixed(2)}</p>}
              {campaign.start_time && <p><strong>Inicio:</strong> {new Date(campaign.start_time).toLocaleDateString()}</p>}
              {campaign.stop_time && <p><strong>Fin:</strong> {new Date(campaign.stop_time).toLocaleDateString()}</p>}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No hay campañas activas.</p>
        )}
      </div>
    </div>
  );
} 
