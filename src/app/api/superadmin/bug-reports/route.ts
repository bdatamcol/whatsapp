import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server.supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const company_id = searchParams.get('company_id');

    let query = supabase
      .from('bug_reports')
      .select(`*`)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (company_id && company_id !== 'all') {
      query = query.eq('company_id', company_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error en query de bug reports:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transformar los datos para incluir nombres correctamente
    const transformedData = data.map(report => ({
      ...report,
      company_name: report.companies?.name || null,
      reporter_name: report.profiles?.email || report.reporter_email || null
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error en endpoint de bug reports:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}