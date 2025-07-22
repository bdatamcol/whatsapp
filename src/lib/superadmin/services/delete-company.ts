import { supabase } from '@/lib/supabase/server.supabase';

export async function deleteCompany(companyId: string) {
    try {
        // IMPORTANTE: Esta función es potencialmente peligrosa y debe usarse con extrema precaución
        // Eliminar una empresa implica eliminar todos sus datos relacionados
        
        // 1. Obtener los perfiles asociados a la empresa
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('company_id', companyId);
            
        // 2. Eliminar los usuarios de auth.users (esto debe hacerse con cuidado)
        if (profiles && profiles.length > 0) {
            for (const profile of profiles) {
                // Eliminar el usuario de auth.users
                await supabase.auth.admin.deleteUser(profile.id);
            }
        }
        
        // 3. Eliminar registros relacionados en otras tablas
        // Nota: Esto depende de las restricciones de clave foránea y cascadas configuradas
        // Si las cascadas están configuradas correctamente, solo necesitamos eliminar la empresa
        
        // 4. Finalmente eliminar la empresa
        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', companyId);
            
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar empresa:', error);
        throw error;
    }
}