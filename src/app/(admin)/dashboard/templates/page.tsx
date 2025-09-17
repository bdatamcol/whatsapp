"use client";

import TemplateForm from "@/app/components/templates/TemplateForm";
import TemplateList from "@/app/components/templates/TemplateList";
import { useEffect, useMemo, useState } from "react";
import { supabase } from '@/lib/supabase/client.supabase';

type Company = {
  id: string;
  name: string;
  waba_id: string | null;
  phone_number_id: string | null;
};

export default function AdminTemplatesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === companyId) || null,
    [companies, companyId]
  );

  async function loadCompanies() {
    setLoadingCompanies(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.company_id) {
        throw new Error('No estás asociado a ninguna empresa');
      }

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name, waba_id, phone_number_id')
        .eq('id', profile.company_id)
        .maybeSingle();

      if (companyError) throw companyError;
      if (!company) {
        throw new Error('Empresa no encontrada');
      }

      setCompanies([company]);
      setCompanyId(company.id);
    } catch (err: any) {
      setError(err.message || "Error");
      setCompanies([]);
      setCompanyId('');
    } finally {
      setLoadingCompanies(false);
    }
  }

  async function loadTemplates(targetCompanyId?: string) {
    const id = targetCompanyId || companyId;
    if (!id) return;
    setLoadingTemplates(true);
    setError(null);
    try {
      const res = await fetch(`/api/templates/list?companyId=${encodeURIComponent(id)}&limit=50`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Error listando plantillas");
      setTemplates(json.data?.data || []);
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoadingTemplates(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (companyId) loadTemplates(companyId);
  }, [companyId]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold">Administrar Plantillas de WhatsApp</h1>
          <p className="text-sm text-gray-500">Crea y consulta plantillas por empresa/WABA. Los tokens se usan server-side desde tu BD.</p>
        </div>
        <div className="p-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa</label>
            <div className="flex gap-2">
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dark-500"
                disabled={loadingCompanies}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                className="rounded-md bg-black hover:bg-black/80 text-white px-3 py-2 text-sm"
                onClick={loadCompanies}
                disabled={loadingCompanies}
              >
                {loadingCompanies ? "..." : "Actualizar"}
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              className="rounded-md bg-black hover:bg-black/80 text-white px-3 py-2 text-sm"
              onClick={() => loadTemplates()}
              disabled={loadingTemplates || !companyId}
            >
              {loadingTemplates ? "Cargando..." : "Cargar/Refrescar plantillas"}
            </button>
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Crear nueva plantilla</h2>
          </div>
          <div className="p-4">
            <TemplateForm
              companyId={companyId}
              onCreated={() => loadTemplates()}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white shadow-sm md:col-span-1">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Plantillas</h2>
          </div>
          <div className="p-4">
            <TemplateList
              templates={templates}
              loading={loadingTemplates}
              onRefresh={() => loadTemplates()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}