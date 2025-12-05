import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client.supabase';

async function fetchFromMeta(url: string, accessToken: string) {
  const response = await fetch(`${url}&access_token=${accessToken}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

export async function POST(request: Request) {
  const version = process.env.META_API_VERSION;
  const { pageId, pageAccessToken, formId, cursor, limit = 50, getSummary = false } = await request.json();
  const baseUrl = 'https://graph.facebook.com';

  if (!formId && (!pageId || !pageAccessToken)) {
    return NextResponse.json({ error: 'Se requieren pageId y pageAccessToken' }, { status: 400 });
  }

  try {
    if (formId) {
      const cacheKey = `leads_${formId}`;
      if (getSummary) {
        // Obtener solo summary para total_count
        const summaryUrl = `${baseUrl}/${version}/${formId}/leads?summary=true`;
        const { summary } = await fetchFromMeta(summaryUrl, pageAccessToken);
        return NextResponse.json({ success: true, total: summary?.total_count || 0 });
      }

      // Verificar caché para leads paginados
      const { data: cached } = await supabase.from('leads_cache').select('*').eq('cache_key', `${cacheKey}_${cursor || 'initial'}`).single();
      if (cached && (Date.now() - cached.updated_at < 3600000)) {
        return NextResponse.json({ success: true, data: cached.leads, paging: cached.paging, fromCache: true });
      }

      // Fetch paginado
      const leadsUrl = `${baseUrl}/${version}/${formId}/leads?fields=created_time,field_data&limit=${limit}${cursor ? `&after=${cursor}` : ''}`;
      const { data, paging } = await fetchFromMeta(leadsUrl, pageAccessToken);

      // Cachear
      await supabase.from('leads_cache').upsert({ cache_key: `${cacheKey}_${cursor || 'initial'}`, leads: data, paging, updated_at: Date.now() });

      return NextResponse.json({ success: true, data, paging });
    }

    // Formularios
    const formsUrl = `${baseUrl}/${version}/${pageId}/leadgen_forms?fields=name,id,status,created_time`;
    const formsData = await fetchFromMeta(formsUrl, pageAccessToken);
    return NextResponse.json({ success: true, data: formsData.data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al procesar leads' }, { status: 500 });
  }
}