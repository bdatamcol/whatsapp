import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server.supabase';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserProfile();
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params; // Fix: await params

    // Verify the assistant belongs to the same company
    const { data: assistant } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', id)
      .eq('role', 'assistant')
      .single();

    if (!assistant) {
      return NextResponse.json({ error: 'Asistente no encontrado' }, { status: 404 });
    }

    if (assistant.company_id !== user.company_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Soft delete the assistant
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_active: false,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}