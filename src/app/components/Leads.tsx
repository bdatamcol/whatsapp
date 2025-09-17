'use client';

import { useEffect, useState, useMemo } from 'react';
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
  type TemplateItem = { id?: string; name: string; language: string; status: string };

  const [companyId, setCompanyId] = useState<string>('');
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [templatesError, setTemplatesError] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [selectedTemplateLanguage, setSelectedTemplateLanguage] = useState<string>('');

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

  // Cargar companyId del usuario
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        if (profile?.company_id) {
          setCompanyId(profile.company_id);
        }
      } catch (e: any) {
        console.error('Error cargando companyId:', e);
      }
    })();
  }, []);

  // Cargar plantillas APPROVED de la empresa
  const fetchTemplates = async (cid: string) => {
    if (!cid) return;
    setLoadingTemplates(true);
    setTemplatesError('');
    try {
      const res = await fetch(`/api/templates/list?companyId=${encodeURIComponent(cid)}&limit=100`);
      const json = await res.json();
      console.log('[Templates API] Respuesta:', json);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Error HTTP ${res.status}`);
      }
      const all: TemplateItem[] = json.data?.data || [];
      const approved = all.filter(t => t.status === 'APPROVED');
      setTemplates(approved);
      if (approved.length > 0) {
        // Preseleccionar menu_inicial si existe; si no, la primera
        const def = approved.find(t => t.name === 'menu_inicial') || approved[0];
        setSelectedTemplateName(def.name);
        setSelectedTemplateLanguage(def.language);
      } else {
        setSelectedTemplateName('');
        setSelectedTemplateLanguage('');
      }
    } catch (e: any) {
      console.error('Error listando plantillas:', e);
      setTemplates([]);
      setSelectedTemplateName('');
      setSelectedTemplateLanguage('');
      setTemplatesError(e?.message || 'No se pudieron cargar las plantillas');
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchTemplates(companyId);
    }
  }, [companyId]);

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

      // Columnas consistentes para el dataset que se exporta
      const exportColumns = computeColumnsFrom(exportLeads as Lead[]);

      const formattedLeads = (exportLeads as Lead[]).map(lead => {
        // Mapa normalizado -> valor para este lead
        const m = new Map<string, string>();
        for (const f of lead.field_data || []) {
          const key = normalize(f.name);
          const val = (f.values || []).join(', ');
          if (m.has(key)) m.set(key, m.get(key)! + '; ' + val);
          else m.set(key, val);
        }

        const row: Record<string, string> = {
          ID: lead.id,
          'Fecha de creación': new Date(lead.created_time).toLocaleString()
        };

        // Misma estructura de columnas que en la tabla
        exportColumns.forEach(col => {
          row[col.label] = m.get(col.key) || '';
        });

        return row;
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
    if (!selectedTemplateName || !selectedTemplateLanguage) {
      alert('Por favor selecciona una plantilla de WhatsApp');
      return;
    }

    setLoading(prev => ({ ...prev, templates: true }));
    setTemplateResult(null);

    try {
      // Intentar usar companyId ya cargado; si no, obtenerlo
      let effectiveCompanyId = companyId;
      if (!effectiveCompanyId) {
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
        effectiveCompanyId = profile.company_id;
        setCompanyId(effectiveCompanyId);
      }

      const response = await fetch('/api/whatsapp/process-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          pageAccessToken,
          companyId: effectiveCompanyId,
          templateName: selectedTemplateName,
          templateLanguage: selectedTemplateLanguage,
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

  // Normaliza etiquetas: quita acentos, pasa a minúsculas, limpia símbolos
  const normalize = (label: string) =>
    label?.toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[_\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s]/g, '');

  // Mapea a alias canónicos para ordenar mejor campos típicos
  const canonicalAlias = (norm: string) => {
    if (!norm) return norm;
    if (/(^|\b)(whatsapp|telefono|phone|celular|movil|numero)(\b|$)/.test(norm)) return 'phone';
    if (/(^|\b)(ciudad|city|municipio)(\b|$)/.test(norm)) return 'city';
    if (/(^|\b)(full name|nombre completo|nombre|name)(\b|$)/.test(norm)) return 'full name';
    if (/(^|\b)(correo electronico|correo|email|e mail)(\b|$)/.test(norm)) return 'email';
    if (/(^|\b)(cc|cedula|dni|identificacion|identificación|documento)(\b|$)/.test(norm)) return 'cc';
    return norm;
  };

  const weight = (alias: string) => {
    switch (alias) {
      case 'phone': return 1;
      case 'city': return 2;
      case 'full name': return 3;
      case 'email': return 4;
      case 'cc': return 5;
      default: return 100;
    }
  };

  // Reutilizable para UI y para exportar CSV
  const computeColumnsFrom = (list: Lead[]) => {
    const map = new Map<string, { label: string; alias: string }>(); // key normalizado -> {label visible, alias}
    for (const lead of list || []) {
      for (const fd of lead.field_data || []) {
        const norm = normalize(fd.name);
        const alias = canonicalAlias(norm);
        if (!map.has(norm)) {
          map.set(norm, { label: fd.name, alias });
        }
      }
    }
    const arr = Array.from(map.entries()).map(([key, info]) => ({ key, label: info.label, alias: info.alias }));
    arr.sort((a, b) => {
      const wa = weight(a.alias);
      const wb = weight(b.alias);
      if (wa !== wb) return wa - wb;
      return a.label.localeCompare(b.label, 'es');
    });
    return arr;
  };

  // Columnas dinámicas basadas en los leads cargados en pantalla
  const columns = useMemo(() => computeColumnsFrom(leads), [leads]);

  // Para cada lead, crea un mapa normalizado -> valor (unidos por coma)
  const valuesByLead = useMemo(() => {
    return leads.map(lead => {
      const m = new Map<string, string>();
      for (const fd of lead.field_data || []) {
        const key = normalize(fd.name);
        const val = (fd.values || []).join(', ');
        if (m.has(key)) m.set(key, m.get(key)! + '; ' + val);
        else m.set(key, val);
      }
      return m;
    });
  }, [leads]);

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

            {/* Selector de plantilla (dinámico por empresa) */}
            {companyId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plantilla de WhatsApp:
                </label>
                <select
                  disabled={loadingTemplates || templates.length === 0}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={
                    selectedTemplateName && selectedTemplateLanguage
                      ? `${selectedTemplateName}::${selectedTemplateLanguage}`
                      : ''
                  }
                  onChange={(e) => {
                    const [name, lang] = e.target.value.split('::');
                    setSelectedTemplateName(name);
                    setSelectedTemplateLanguage(lang);
                  }}
                >
                  <option value="">{loadingTemplates ? 'Cargando plantillas...' : 'Selecciona una plantilla'}</option>
                  {templates.map((t) => (
                    <option key={`${t.name}::${t.language}`} value={`${t.name}::${t.language}`}>
                      {t.name} ({t.language})
                    </option>
                  ))}
                </select>
                {loadingTemplates && (
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Cargando plantillas...
                  </div>
                )}
                {!loadingTemplates && templates.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No hay plantillas aprobadas disponibles.</p>
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
                            <Loader2 className="animate-spin mr-2 h-4 w-4" />
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
                          {columns.map((col) => (
                            <th
                              key={col.key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leads.map((lead, idx) => {
                          const m = valuesByLead[idx] || new Map<string, string>();
                          return (
                            <tr key={lead.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(lead.created_time).toLocaleString()}
                              </td>
                              {columns.map((col) => (
                                <td
                                  key={col.key}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                >
                                  {m.get(col.key) || ''}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
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