import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Variable para rastrear el estado de autenticación actual
let currentSession = null;

// Función para verificar el estado de la empresa del usuario actual - SIN intervalos agresivos
async function checkCompanyStatus() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            // Si no hay sesión, verificar si deberíamos estar logueados
            if (currentSession && typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            return;
        }

        // Actualizar sesión actual
        currentSession = session;

        // Obtener perfil del usuario
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id, role')
            .eq('id', session.user.id)
            .maybeSingle();

        if (!profile || !profile.company_id || profile.role === 'superadmin') return;

        // Verificar si la empresa está activa
        const { data: company } = await supabase
            .from('companies')
            .select('is_active')
            .eq('id', profile.company_id)
            .maybeSingle();

        if (company && !company.is_active) {
            // Empresa desactivada, cerrar sesión inmediatamente
            await supabase.auth.signOut();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
    } catch (error) {
        console.error('Error al verificar estado de la empresa:', error);
    }
}

// Agregar listener para cambios en la autenticación (solo en browser)
if (typeof window !== 'undefined') {
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event, session ? 'Session active' : 'No session');
        
        if (event === 'SIGNED_OUT') {
            currentSession = null;
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        } else if (event === 'SIGNED_IN') {
            currentSession = session;
        } else if (event === 'TOKEN_REFRESHED') {
            currentSession = session;
        }
    });

    // Verificar solo al cargar la página, no cada 10 segundos
    setTimeout(() => {
        checkCompanyStatus();
    }, 1000);
}