import { useEffect, useState } from 'react';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import { FacebookConfigError } from './FacebookConfigError';

interface Metric {
    campaignName: string;
    spend: number;
    impressions: number;
    reach?: number;
    clicks?: number;
    cpc?: number;
    ctr?: number;
    frequency?: number;
    dateStart: string;
    dateStop: string;
}

const MetricsDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<any[]>([]);
    const [filteredMetrics, setFilteredMetrics] = useState<any[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<string>('');
    const [configError, setConfigError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/marketing/company/insights');

                if (!response.ok) {
                    const errorText = await response.text();

                    // Detectar específicamente el error de configuración de Facebook
                    if (errorText.includes('configuración de Facebook completa')) {
                        setConfigError('Facebook no está configurado');
                    } else {
                        console.error('Error en la solicitud:', errorText || 'Respuesta vacía');
                    }
                    return;
                }

                const data = await response.json();
                setMetrics(data.data || []);
                setFilteredMetrics(data.data || []);
                setConfigError(null);

            } catch (error) {
                console.error('Error al obtener los datos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = event.target.value;
        setSelectedCampaign(selected);
        if (selected === '') {
            setFilteredMetrics(metrics);
        } else {
            setFilteredMetrics(metrics.filter(metric => metric.campaignName === selected));
        }
    };

    const uniqueCampaigns = Array.from(new Set(metrics.map(metric => metric.campaignName)));

    // Mostrar mensaje de configuración si Facebook no está configurado
    if (configError) {
        return (
            <FacebookConfigError
                title="Configuración de Facebook Requerida"
                message="Para ver las métricas de tus campañas publicitarias, necesitas configurar tu cuenta de Facebook Ads."
            />
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                            <p className="text-gray-600">Cargando métricas...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            {/* Filtro de Campañas */}
            <div className="mb-4">
                <select value={selectedCampaign} onChange={handleFilterChange} className="p-2 border border-gray-300 rounded">
                    <option value="">Todas las Campañas</option>
                    {uniqueCampaigns.map(campaign => (
                        <option key={campaign} value={campaign}>{campaign}</option>
                    ))}
                </select>
            </div>

            {/* Gráfico de Rendimiento */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Gráfico de Rendimiento</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={filteredMetrics} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="campaignName" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="spend" stroke="#8884d8" />
                            <Line type="monotone" dataKey="impressions" stroke="#82ca9d" />
                            <Line type="monotone" dataKey="clicks" stroke="#ff7300" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Tabla de Métricas Detalladas */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Métricas Detalladas</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea>
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Nombre de la Campaña</th>
                                    <th className="px-6 py-3">Fecha Inicio</th>
                                    <th className="px-6 py-3">Fecha Fin</th>
                                    <th className="px-6 py-3">Gasto</th>
                                    <th className="px-6 py-3">Impresiones</th>
                                    <th className="px-6 py-3">Alcance</th>
                                    <th className="px-6 py-3">Clics</th>
                                    <th className="px-6 py-3">CPC</th>
                                    <th className="px-6 py-3">CTR</th>
                                    <th className="px-6 py-3">Frecuencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMetrics.map((metric, index) => (
                                    <tr key={index} className="bg-white border-b hover:bg-gray-100">
                                        <td className="px-6 py-4">{metric.campaignName}</td>
                                        <td className="px-6 py-4">{metric.dateStart}</td>
                                        <td className="px-6 py-4">{metric.dateStop}</td>
                                        <td>{metric.spend.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                                        <td>{metric.impressions.toLocaleString()}</td>
                                        <td className="px-6 py-4">{metric.reach}</td>
                                        <td className="px-6 py-4">{metric.clicks}</td>
                                        <td className="px-6 py-4">{metric.cpc}</td>
                                        <td className="px-6 py-4">{metric.ctr}</td>
                                        <td className="px-6 py-4">{metric.frequency}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
};

export default MetricsDashboard;