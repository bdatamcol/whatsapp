import { supabase } from '@/lib/supabase/server.supabase';

export async function deleteCompany(companyId: string) {
    try {
        // Soft delete: Actualizar el estado is_active a false en lugar de eliminar
        const { error: companyError } = await supabase
            .from('companies')
            .update({ is_active: false })
            .eq('id', companyId);
            
        if (companyError) throw companyError;

        // Obtener todos los usuarios de esta empresa
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id')
            .eq('company_id', companyId);

        if (usersError) throw usersError;

        // Forzar cierre de sesión para todos los usuarios de esta empresa
        const userIds = users.map(user => user.id);
        for (const userId of userIds) {
            try {
                await supabase.auth.admin.signOut(userId);
            } catch (logoutError) {
                console.error(`Error al cerrar sesión del usuario ${userId}:`, logoutError);
            }
        }
        
        return { success: true, usersTerminated: userIds.length };
    } catch (error) {
        console.error('Error al desactivar empresa:', error);
        throw error;
    }
}