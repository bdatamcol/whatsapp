'use client';

import { useEffect, useState } from 'react';
import { Loader2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/csv';
import Button from './ui/Button';
import Card, { CardContent } from './ui/card';

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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState({
    pages: false,
    forms: false,
    leads: false
  });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 10;

  // Calcular leads para la página actual
  const indexOfLastLead = currentPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const currentLeads = leads.slice(indexOfFirstLead, indexOfLastLead);
  const totalPages = Math.ceil(leads.length / leadsPerPage);

  // Obtener páginas de Facebook al iniciar
  useEffect(() => {
    const fetchPages = async () => {
      setLoading(prev => ({ ...prev, pages: true }));
      setError('');
      try {
        const res = await fetch('/api/marketing/account');
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
        setCurrentPage(1); // Resetear paginación
      } catch (err: any) {
        setError(err.message || 'Error al cargar formularios');
        console.error('Error fetching forms:', err);
      } finally {
        setLoading(prev => ({ ...prev, forms: false }));
      }
    };

    fetchForms();
  }, [pageId, pageAccessToken]);

  // Obtener leads cuando se selecciona un formulario
  useEffect(() => {
    if (!formId || !pageAccessToken) return;

    const fetchLeads = async () => {
      setLoading(prev => ({ ...prev, leads: true }));
      setError('');
      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formId, pageId, pageAccessToken }),
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || 'Error al obtener leads');
        }
        
        setLeads(json.data || []);
        setCurrentPage(1); // Resetear paginación
      } catch (err: any) {
        setError(err.message || 'Error al obtener leads');
        console.error('Error fetching leads:', err);
      } finally {
        setLoading(prev => ({ ...prev, leads: false }));
      }
    };

    fetchLeads();
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

  const handleExportCSV = () => {
    if (!leads.length) return;

    const formattedLeads = leads.map(lead => {
      const formattedLead: Record<string, string> = {
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
  };

  // Funciones de paginación
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
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
                        Mostrando {indexOfFirstLead + 1}-{Math.min(indexOfLastLead, leads.length)} de {leads.length} leads
                      </p>
                    )}
                  </div>
                  {leads.length > 0 && (
                    <Button
                      onClick={handleExportCSV}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Exportar CSV
                    </Button>
                  )}
                </div>

                {loading.leads ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="animate-spin mr-2 h-6 w-6" />
                    Cargando leads...
                  </div>
                ) : leads.length > 0 ? (
                  <>
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
                          {currentLeads.map((lead) => (
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

                    {/* Controles de paginación */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                          </Button>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <Button
                                key={page}
                                onClick={() => goToPage(page)}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                className="min-w-[2.5rem]"
                              >
                                {page}
                              </Button>
                            ))}
                          </div>

                          <Button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          Página {currentPage} de {totalPages}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No se encontraron leads para este formulario
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