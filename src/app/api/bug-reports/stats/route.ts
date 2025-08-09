import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client.supabase';

export async function GET() {
  try {
    const { data: stats, error } = await supabase
      .from('bug_reports')
      .select('status, priority, category');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const statsData = {
      total: stats.length,
      open: stats.filter(r => r.status === 'open').length,
      in_progress: stats.filter(r => r.status === 'in_progress').length,
      resolved: stats.filter(r => r.status === 'resolved').length,
      closed: stats.filter(r => r.status === 'closed').length,
      by_priority: {
        baja: stats.filter(r => r.priority === 'baja').length,
        media: stats.filter(r => r.priority === 'media').length,
        alta: stats.filter(r => r.priority === 'alta').length,
        critica: stats.filter(r => r.priority === 'critica').length,
      },
      by_category: {
        ui: stats.filter(r => r.category === 'ui').length,
        api: stats.filter(r => r.category === 'api').length,
        rendimiento: stats.filter(r => r.category === 'rendimiento').length,
        seguridad: stats.filter(r => r.category === 'seguridad').length,
        funcionalidad: stats.filter(r => r.category === 'funcionalidad').length,
        otro: stats.filter(r => r.category === 'otro').length,
      }
    };

    return NextResponse.json(statsData);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}