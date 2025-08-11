import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server.supabase';

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string }}
) {
  try {
    const { id } = await context.params;
    console.log('id', id);
    const body = await request.json();
    const { status, priority } = body;
    
    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('bug_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating bug report:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el reporte', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string }}
) {
  try {
    const { id } = await context.params;
    const { error } = await supabase
      .from('bug_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting bug report:', error);
      return NextResponse.json(
        { error: 'Error al eliminar el reporte', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}