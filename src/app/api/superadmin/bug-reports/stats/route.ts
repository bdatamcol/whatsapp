import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client.supabase';

export async function GET() {
  try {
    const { data: stats, error } = await supabase.rpc('get_bug_report_summary');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const summary = {
      total: stats.reduce((sum, item) => sum + parseInt(item.count), 0),
      byStatus: stats.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + parseInt(item.count);
        return acc;
      }, {}),
      byPriority: stats.reduce((acc, item) => {
        acc[item.priority] = (acc[item.priority] || 0) + parseInt(item.count);
        return acc;
      }, {}),
      byCategory: stats.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + parseInt(item.count);
        return acc;
      }, {})
    };

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
