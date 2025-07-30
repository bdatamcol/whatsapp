import { supabase } from '@/lib/supabase/server.supabase';

export interface DeactivationResult {
  success: boolean;
  message: string;
  usersTerminated: number;
}

export async function deactivateCompanyWithSessions(companyId: string): Promise<DeactivationResult> {
  try {
    // Verificar que la empresa existe
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .maybeSingle();

    if (companyError) throw companyError;
    if (!company) {
      throw new Error('Empresa no encontrada');
    }

    // Desactivar la empresa
    const { error: updateError } = await supabase
      .from('companies')
      .update({ is_active: false })
      .eq('id', companyId);

    if (updateError) throw updateError;

    // Obtener todos los usuarios activos de esta empresa
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('company_id', companyId);

    if (usersError) throw usersError;

    // Forzar cierre de sesión para todos los usuarios de esta empresa
    let terminatedCount = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        await supabase.auth.admin.signOut(user.id);
        terminatedCount++;
      } catch (logoutError: any) {
        console.error(`Error al cerrar sesión del usuario ${user.email} (${user.id}):`, logoutError);
        errors.push(`Usuario ${user.email}: ${logoutError.message}`);
      }
    }

    const message = `Empresa "${company.name}" desactivada exitosamente. ${terminatedCount} sesiones cerradas.`;
    
    if (errors.length > 0) {
      console.warn('Algunas sesiones no pudieron cerrarse:', errors);
    }

    return {
      success: true,
      message,
      usersTerminated: terminatedCount
    };

  } catch (error: any) {
    console.error('Error al desactivar empresa:', error);
    throw error;
  }
}

export async function reactivateCompany(companyId: string): Promise<DeactivationResult> {
  try {
    // Verificar que la empresa existe
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .maybeSingle();

    if (companyError) throw companyError;
    if (!company) {
      throw new Error('Empresa no encontrada');
    }

    // Reactivar la empresa
    const { error: updateError } = await supabase
      .from('companies')
      .update({ is_active: true })
      .eq('id', companyId);

    if (updateError) throw updateError;

    return {
      success: true,
      message: `Empresa "${company.name}" reactivada exitosamente`,
      usersTerminated: 0
    };

  } catch (error: any) {
    console.error('Error al reactivar empresa:', error);
    throw error;
  }
}