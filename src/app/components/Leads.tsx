'use client';

import { useEffect, useState } from 'react';
import { Loader2, Download, Send, MessageSquare } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/csv';
import Button from './ui/Button';
import Card, { CardContent } from './ui/card';
import { supabase } from '@/lib/supabase/client.supabase';

interface Page {
  id: string;
  name: string;
  access_token?: string;
  [key: string]: any;
}

interface Form {
  id: string;
  name: string;
  status: string;
  created_time: string;
}

interface LeadField {
  name: string;
  values: string[];
}

interface Lead {
  created_time: string;
  field_data: LeadField[];
  id: string;
}

export default function Leads() {
  const [pages, setPages] = useState<Page[]>([]);
  const [pageId, setPageId] = useState('');
  const [pageAccessToken, setPageAccessToken] = useState('');
  const [forms, setForms] = useState<Form[]>([]);
  const [formId, setFormId] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState({
    pages: false,
    forms: false,
    leads: false,
    more: false,
    templates: false
  });
  const [templateResult, setTemplateResult] = useState<any>(null);

  // Obtener páginas de Facebook al iniciar
  useEffect(() => {
    const fetchPages = async () => {
      setLoading(prev => ({ ...prev, pages: true }));
      setError('');
      try {
        const res = await fetch('/api/marketing/company/account');
        const json = await res.json();

        if (!res.ok || json.error) {
          throw new Error(json.error || 'Error al obtener páginas');
        }

        const pagesWithToken = json.pages?.filter((page: Page) => page.access_token) || [];
        setPages(pagesWithToken);

        if (pagesWithToken.length === 0) {
          setError('No se encontraron páginas con permisos suficientes');
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar páginas');
        console.error('Error fetching pages:', err);
      } finally {
        setLoading(prev => ({ ...prev, pages: false }));
      }
    };

    fetchPages();
  }, []);

  // Obtener formularios cuando se selecciona una página
  useEffect(() => {
    if (!pageId || !pageAccessToken) return;

    const fetchForms = async () => {
      setLoading(prev => ({ ...prev, forms: true }));
      setError('');
      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId, pageAccessToken }),
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || 'Error al cargar formularios');
        }

        setForms(json.data || []);
        setFormId('');
        setLeads([]);
        setNextCursor(null);
      } catch (err: any) {
        setError(err.message || 'Error al cargar formularios');
        console.error('Error fetching forms:', err);
      } finally {
        setLoading(prev => ({ ...prev, forms: false }));
      }
    };

    fetchForms();
  }, [pageId, pageAccessToken]);

  // Función para cargar leads (inicial o más)
  const loadLeads = async (cursor: string | null = null) => {
    if (!formId || !pageAccessToken) return;

    setLoading(prev => ({ ...prev, ...(cursor ? { more: true } : { leads: true }) }));
    setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, pageId, pageAccessToken, cursor, limit: 50 }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Error al obtener leads');
      }

      setLeads(prev => cursor ? [...prev, ...json.data] : json.data);
      setNextCursor(json.paging?.next ? json.paging.cursors.after : null);
    } catch (err: any) {
      setError(err.message || 'Error al obtener leads');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(prev => ({ ...prev, ...(cursor ? { more: false } : { leads: false }) }));
    }
  };

  // Cargar leads iniciales cuando se selecciona formulario
  useEffect(() => {
    loadLeads();
  }, [formId, pageAccessToken]);

  const handlePageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const selected = pages.find(p => p.id === id);

    if (!selected) {
      setError('Página no encontrada');
      return;
    }

    if (!selected.access_token) {
      setError('Esta página no tiene token de acceso válido');
      return;
    }

    setPageId(id);
    setPageAccessToken(selected.access_token);
    setError('');
  };

  // Obtener total cuando se selecciona formulario
  useEffect(() => {
    if (!formId || !pageAccessToken) return;

    const fetchTotal = async () => {
      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formId, pageId, pageAccessToken, getSummary: true }),
        });

        if (!res.ok) throw new Error('Error al obtener total');
        const { total } = await res.json();
        setTotalLeads(total || 0);
      } catch (err) {
        console.error('Error fetching total:', err);
      }
    };

    fetchTotal();
  }, [formId, pageAccessToken, pageId]);

  // Función para cargar todos los leads (para export)
  const loadAllLeads = async () => {
    let allLeads = [...leads];
    let currentCursor = nextCursor;

    while (currentCursor) {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, pageId, pageAccessToken, cursor: currentCursor, limit: 50 }),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Error al cargar más leads');
      
      allLeads = [...allLeads, ...json.data];
      console.log('All Leads', allLeads);
      currentCursor = json.paging?.cursors?.after || null;
    }

    return allLeads;
  };

  const handleExportCSV = async () => {
    try {
      let exportLeads = leads;
      if (nextCursor) {
        exportLeads = await loadAllLeads();
      }
      if (!exportLeads.length) return;

      const formattedLeads = exportLeads.map(lead => {
        const formattedLead = {
          ID: lead.id,
          'Fecha de creación': new Date(lead.created_time).toLocaleString()
        };

        lead.field_data.forEach(field => {
          formattedLead[field.name] = field.values.join(', ');
        });

        return formattedLead;
      });

      exportToCSV(formattedLeads, {
        filename: `leads_${formId}`,
        includeTimestamp: true
      });
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Error al exportar CSV');
    }
  };

  // Función para enviar plantillas WhatsApp
  const handleSendWhatsAppTemplates = async () => {
    if (!formId || !pageAccessToken) {
      alert('Por favor selecciona un formulario primero');
      return;
    }

    setLoading(prev => ({ ...prev, templates: true }));
    setTemplateResult(null);

    try {
      // Obtener company_id del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.company_id) {
        alert('No estás asociado a ninguna empresa');
        return;
      }

      const response = await fetch('/api/whatsapp/process-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          pageAccessToken,
          companyId: profile.company_id,
          templateName: 'menu_inicial',
          pageId
        })
      });

      const result = await response.json();
      setTemplateResult(result);

      if (result.success) {
        alert(`✅ Plantillas enviadas: ${result.data.sent}\n❌ Fallidas: ${result.data.failed}`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }

    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold mb-4">📋 Gestión de Leads</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {templateResult && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
              <strong>Resultado del envío:</strong>
              <br />
              ✅ Enviados: {templateResult.data?.sent || 0}
              <br />
              ❌ Fallidos: {templateResult.data?.failed || 0}
              {templateResult.data?.errors?.length > 0 && (
                <>
                  <br />
                  <strong>Errores:</strong>
                  <ul className="list-disc list-inside">
                    {templateResult.data.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="space-y-4">
            {/* Selector de páginas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Página de Facebook:
              </label>
              <select
                value={pageId}
                onChange={handlePageChange}
                disabled={loading.pages}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecciona una página</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
              {loading.pages && (
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Cargando páginas...
                </div>
              )}
            </div>

            {/* Selector de formularios */}
            {pageId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formulario:
                </label>
                <select
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  disabled={loading.forms}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona un formulario</option>
                  {forms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.name} ({form.status})
                    </option>
                  ))}
                </select>
                {loading.forms && (
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Cargando formularios...
                  </div>
                )}
              </div>
            )}

            {/* Lista de leads */}
            {formId && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Leads recibidos</h2>
                    {leads.length > 0 && (
                      <p className="text-sm text-gray-500">
                        Mostrando {leads.length} de {totalLeads} leads (carga progresiva)
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {leads.length > 0 && (
                      <>
                        <Button
                          onClick={handleExportCSV}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Exportar CSV
                        </Button>
                        
                        <Button
                          onClick={handleSendWhatsAppTemplates}
                          disabled={loading.templates}
                          variant="default"
                          size="sm"
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          {loading.templates ? (
                            <Loader2 className="animate-spin h-4 w-4" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Enviar Plantillas WhatsApp
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {loading.leads ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="animate-spin mr-2 h-6 w-6" />
                    Cargando leads...
                  </div>
                ) : leads.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          {leads[0].field_data.map((field) => (
                            <th
                              key={field.name}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {field.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leads.map((lead) => (
                          <tr key={lead.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(lead.created_time).toLocaleString()}
                            </td>
                            {lead.field_data.map((field) => (
                              <td
                                key={field.name}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {field.values.join(', ')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No se encontraron leads para este formulario
                  </div>
                )}

                {nextCursor && (
                  <div className="mt-4 text-center">
                    <Button
                      onClick={() => loadLeads(nextCursor)}
                      disabled={loading.more}
                      variant="outline"
                    >
                      {loading.more ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Cargando más...
                        </>
                      ) : (
                        'Cargar más leads'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}