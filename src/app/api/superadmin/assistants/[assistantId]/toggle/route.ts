import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';
import { supabase } from '@/lib/supabase/server.supabase';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  try {
    const profile = await getUserProfile(req);
    if (!profile || profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Await params before destructuring
    const { assistantId } = await params;
    const { is_active } = await req.json();

    // Actualizar el estado del asistente
    const { error } = await supabase
      .from('profiles')
      .update({ is_active, deleted_at: is_active ? null : new Date().toISOString() })
      .eq('id', assistantId)
      .eq('role', 'assistant');

    if (error) throw error;

    // Si se está desactivando, cerrar todas las sesiones activas
    if (!is_active) {
      await supabase.auth.admin.signOut(assistantId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar asistente:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}