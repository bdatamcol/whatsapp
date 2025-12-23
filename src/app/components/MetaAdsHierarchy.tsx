'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import Button from './ui/Button';
import { ArrowLeft, Download, Loader2, Layers, Grid, FileText, Users } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/csv';
import { toast } from 'sonner';

// Types
interface Campaign {
    id: string;
    name: string;
    status: string;
    objective: string;
    daily_budget?: string;
}

interface AdSet {
    id: string;
    name: string;
    status: string;
    daily_budget?: string;
    start_time?: string;
    end_time?: string;
    targeting?: any;
}

interface Ad {
    id: string;
    name: string;
    status: string;
    creative?: {
        id: string;
        name: string;
        thumbnail_url?: string;
    };
    preview_shareable_link?: string;
}

interface Lead {
    id: string;
    created_time: string;
    field_data: Array<{ name: string; values: string[] }>;
}

export default function MetaAdsHierarchy() {
    const [view, setView] = useState<'campaigns' | 'adsets' | 'ads' | 'leads'>('campaigns');
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [selectedAdSet, setSelectedAdSet] = useState<AdSet | null>(null);
    const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

    // Fetch Campaigns
    const { data: campaignsData, isLoading: isLoadingCampaigns } = useQuery({
        queryKey: ['facebook-campaigns'],
        queryFn: async () => {
            const res = await fetch('/api/marketing/company/ads?limit=50');
            if (!res.ok) throw new Error('Error fetching campaigns');
            return res.json();
        },
        enabled: view === 'campaigns'
    });

    // Fetch Ad Sets
    const { data: adSetsData, isLoading: isLoadingAdSets } = useQuery({
        queryKey: ['facebook-adsets', selectedCampaign?.id],
        queryFn: async () => {
            if (!selectedCampaign?.id) return { data: [] };
            const res = await fetch(`/api/marketing/company/campaigns/${selectedCampaign.id}/adsets`);
            if (!res.ok) throw new Error('Error fetching ad sets');
            return res.json();
        },
        enabled: view === 'adsets' && !!selectedCampaign?.id
    });

    // Fetch Ads
    const { data: adsData, isLoading: isLoadingAds } = useQuery({
        queryKey: ['facebook-ads', selectedAdSet?.id],
        queryFn: async () => {
            if (!selectedAdSet?.id) return { data: [] };
            const res = await fetch(`/api/marketing/company/adsets/${selectedAdSet.id}/ads`);
            if (!res.ok) throw new Error('Error fetching ads');
            return res.json();
        },
        enabled: view === 'ads' && !!selectedAdSet?.id
    });

    // Fetch Leads
    const { data: leadsData, isLoading: isLoadingLeads } = useQuery({
        queryKey: ['facebook-leads', selectedAd?.id],
        queryFn: async () => {
            if (!selectedAd?.id) return { data: [] };
            const res = await fetch(`/api/marketing/company/ads/${selectedAd.id}/leads`);
            if (!res.ok) throw new Error('Error fetching leads');
            return res.json();
        },
        enabled: view === 'leads' && !!selectedAd?.id
    });

    const handleSelectCampaign = (campaign: Campaign) => {
        setSelectedCampaign(campaign);
        setView('adsets');
    };

    const handleSelectAdSet = (adSet: AdSet) => {
        setSelectedAdSet(adSet);
        setView('ads');
    };

    const handleSelectAd = (ad: Ad) => {
        setSelectedAd(ad);
        setView('leads');
    };

    const handleBack = () => {
        if (view === 'leads') setView('ads');
        else if (view === 'ads') setView('adsets');
        else if (view === 'adsets') setView('campaigns');
    };

    const handleDownloadLeads = () => {
        if (!leadsData?.data || leadsData.data.length === 0) {
            toast.error('No hay leads para descargar');
            return;
        }

        const flattenedLeads = leadsData.data.map((lead: Lead) => {
            const fields: Record<string, string> = {
                id: lead.id,
                created_time: new Date(lead.created_time).toLocaleString(),
            };
            lead.field_data.forEach(field => {
                fields[field.name] = field.values.join(', ');
            });
            return fields;
        });

        exportToCSV(flattenedLeads, `leads_ad_${selectedAd?.name}_${new Date().toISOString()}.csv`);
        toast.success('Leads descargados correctamente');
    };

    const Breadcrumbs = () => (
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <span className={view === 'campaigns' ? 'font-bold text-blue-600' : ''}>Campañas</span>
            {selectedCampaign && (
                <>
                    <span>/</span>
                    <span className={view === 'adsets' ? 'font-bold text-blue-600' : ''}>{selectedCampaign.name}</span>
                </>
            )}
            {selectedAdSet && (
                <>
                    <span>/</span>
                    <span className={view === 'ads' ? 'font-bold text-blue-600' : ''}>{selectedAdSet.name}</span>
                </>
            )}
            {selectedAd && (
                <>
                    <span>/</span>
                    <span className={view === 'leads' ? 'font-bold text-blue-600' : ''}>{selectedAd.name}</span>
                </>
            )}
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    {view !== 'campaigns' && (
                        <Button variant="outline" size="sm" onClick={handleBack}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Button>
                    )}
                    <h2 className="text-2xl font-bold">
                        {view === 'campaigns' && 'Campañas'}
                        {view === 'adsets' && 'Conjuntos de Anuncios'}
                        {view === 'ads' && 'Anuncios'}
                        {view === 'leads' && 'Clientes Potenciales (Leads)'}
                    </h2>
                </div>
                {view === 'leads' && (
                    <Button onClick={handleDownloadLeads}>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar CSV
                    </Button>
                )}
            </div>

            <Breadcrumbs />

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {view === 'campaigns' && (
                                <>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Objetivo</TableHead>
                                    <TableHead>Presupuesto Diario</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </>
                            )}
                            {view === 'adsets' && (
                                <>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Inicio</TableHead>
                                    <TableHead>Fin</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </>
                            )}
                            {view === 'ads' && (
                                <>
                                    <TableHead>Imagen</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </>
                            )}
                            {view === 'leads' && (
                                <>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Datos</TableHead>
                                </>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {view === 'campaigns' && isLoadingCampaigns && (
                            <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                        )}
                        {view === 'campaigns' && campaignsData?.data?.map((campaign: Campaign) => (
                            <TableRow key={campaign.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleSelectCampaign(campaign)}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-blue-500" />
                                    {campaign.name}
                                </TableCell>
                                <TableCell>{campaign.status}</TableCell>
                                <TableCell>{campaign.objective}</TableCell>
                                <TableCell>{campaign.daily_budget ? `$${(parseInt(campaign.daily_budget) / 100).toFixed(2)}` : '-'}</TableCell>
                                <TableCell><Button size="sm" variant="ghost">Ver Conjuntos</Button></TableCell>
                            </TableRow>
                        ))}

                        {view === 'adsets' && isLoadingAdSets && (
                            <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                        )}
                        {view === 'adsets' && adSetsData?.data?.map((adSet: AdSet) => (
                            <TableRow key={adSet.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleSelectAdSet(adSet)}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Grid className="w-4 h-4 text-green-500" />
                                    {adSet.name}
                                </TableCell>
                                <TableCell>{adSet.status}</TableCell>
                                <TableCell>{adSet.start_time ? new Date(adSet.start_time).toLocaleDateString() : '-'}</TableCell>
                                <TableCell>{adSet.end_time ? new Date(adSet.end_time).toLocaleDateString() : '-'}</TableCell>
                                <TableCell><Button size="sm" variant="ghost">Ver Anuncios</Button></TableCell>
                            </TableRow>
                        ))}

                        {view === 'ads' && isLoadingAds && (
                            <TableRow><TableCell colSpan={4} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                        )}
                        {view === 'ads' && adsData?.data?.map((ad: Ad) => (
                            <TableRow key={ad.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleSelectAd(ad)}>
                                <TableCell>
                                    {ad.creative?.thumbnail_url ? (
                                        <img src={ad.creative.thumbnail_url} alt="Ad" className="w-10 h-10 object-cover rounded" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-gray-500" />
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{ad.name}</TableCell>
                                <TableCell>{ad.status}</TableCell>
                                <TableCell><Button size="sm" variant="ghost">Ver Leads</Button></TableCell>
                            </TableRow>
                        ))}

                        {view === 'leads' && isLoadingLeads && (
                            <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                        )}
                        {view === 'leads' && leadsData?.data?.map((lead: Lead) => (
                            <TableRow key={lead.id}>
                                <TableCell>{lead.id}</TableCell>
                                <TableCell>{new Date(lead.created_time).toLocaleString()}</TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        {lead.field_data?.map(f => (
                                            <div key={f.name}><span className="font-semibold">{f.name}:</span> {f.values.join(', ')}</div>
                                        ))}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}