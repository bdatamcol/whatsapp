'use client';

import { useEffect, useState } from 'react';

interface Page {
  id: string;
  name: string;
  access_token?: string;
  [key: string]: any;
}

interface Form {
  id: string;
  name: string;
  [key: string]: any;
}

interface Lead {
  created_time: string;
  field_data?: Array<{
    name: string;
    values: string[];
  }>;
  [key: string]: any;
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

        // Filtrar páginas que tienen access_token
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
          body: JSON.stringify({ formId, pageAccessToken }),
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || 'Error al obtener leads');
        }
        
        setLeads(json.data || []);
      } catch (err: any) {
        setError(err.message || 'Error al obtener leads');
        console.error('Error fetching leads:', err);
      } finally {
        setLoading(prev => ({ ...prev, leads: false }));
      }
    };

    fetchLeads();
  }, [formId, pageAccessToken]);

  // Manejar cambio de página
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

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4">📋 Leads recibidos</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Selector de páginas */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Selecciona una página:
        </label>
        <select
          value={pageId}
          onChange={handlePageChange}
          disabled={loading.pages}
          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Selecciona --</option>
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.name} {!page.access_token && "(sin permisos)"}
            </option>
          ))}
        </select>
        {loading.pages && <p className="text-sm text-gray-500 mt-1">Cargando páginas...</p>}
      </div>

      {/* Selector de formularios */}
      {pageId && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selecciona un formulario:
          </label>
          <select
            value={formId}
            onChange={(e) => setFormId(e.target.value)}
            disabled={loading.forms || forms.length === 0}
            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Selecciona --</option>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.name}
              </option>
            ))}
          </select>
          {loading.forms && <p className="text-sm text-gray-500 mt-1">Cargando formularios...</p>}
          {!loading.forms && forms.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">No se encontraron formularios para esta página</p>
          )}
        </div>
      )}

      {/* Tabla de leads */}
      {loading.leads && <p className="text-sm text-gray-500">Cargando leads...</p>}
      
      {leads.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🧑 Nombre</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📧 Correo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📞 Teléfono</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📆 Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {lead.field_data?.find(f => f.name === 'full_name')?.values?.[0] || '—'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {lead.field_data?.find(f => f.name === 'email')?.values?.[0] || '—'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {lead.field_data?.find(f => f.name === 'phone_number')?.values?.[0] || '—'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(lead.created_time).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}