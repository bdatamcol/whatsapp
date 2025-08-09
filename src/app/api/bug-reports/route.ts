import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client.supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let query = supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('bug_reports')
      .insert([{
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority,
        status: 'open',
        reporter_email: body.reporter_email || null,
        browser_info: body.browser_info || null,
        device_info: body.device_info || null,
        os_info: body.os_info || null,
        url: body.url || null,
        screenshot_url: body.screenshot_url || null,
        metadata: body.metadata || {},
        user_id: body.user_id,
        company_id: body.company_id,
        role: body.role
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear reporte' }, { status: 500 });
  }
}