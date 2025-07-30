import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Variable para rastrear el estado de autenticación actual
let currentSession = null;

// Función para verificar el estado de la empresa del usuario actual
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
        // En caso de error, asumir sesión inválida
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
}

// Función para manejar errores de autenticación
function handleAuthError(error: any) {
    console.error('Auth error:', error);
    if (error?.code === 'PGRST301' || error?.message?.includes('JWT') || error?.message?.includes('expired')) {
        // Token expirado o inválido
        supabase.auth.signOut().then(() => {
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        });
    }
}

// Agregar listener robusto para cambios en la autenticación (solo en browser)
if (typeof window !== 'undefined') {
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event, session ? 'Session active' : 'No session');
        
        if (event === 'SIGNED_OUT') {
            currentSession = null;
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        } else if (event === 'TOKEN_REFRESHED') {
            if (!session) {
                // Token refresh falló
                window.location.href = '/login';
            } else {
                currentSession = session;
            }
        } else if (event === 'SIGNED_IN') {
            currentSession = session;
        }
    });
}

// Interceptar errores de red relacionados con autenticación (solo en browser)
if (typeof window !== 'undefined') {
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') {
            currentSession = session;
        }
    });
}

// Verificar el estado de forma más frecuente y confiable (solo en browser)
if (typeof window !== 'undefined') {
    setInterval(async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                handleAuthError(error);
                return;
            }
            
            if (!session && currentSession) {
                // Sesión perdida
                currentSession = null;
                window.location.href = '/login';
                return;
            }
            
            if (session) {
                currentSession = session;
                await checkCompanyStatus();
            }
        } catch (error: any) {
            handleAuthError(error);
        }
    }, 10000); // Verificar cada 10 segundos

    // Verificar inmediatamente al cargar la página
    setTimeout(() => {
        checkCompanyStatus();
    }, 1000);
}

// Manejar errores globales de fetch que podrían indicar token expirado (solo en browser)
if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        try {
            const response = await originalFetch(...args);
            
            // Si recibimos 401/403, podría ser token expirado
            if (response.status === 401 || response.status === 403) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.clone().json();
                    if (errorData.message?.includes('JWT') || errorData.message?.includes('expired')) {
                        supabase.auth.signOut().then(() => {
                            window.location.href = '/login';
                        });
                    }
                }
            }
            
            return response;
        } catch (error: any) {
            if (error.message?.includes('JWT') || error.message?.includes('expired') || error.message?.includes('auth')) {
                supabase.auth.signOut().then(() => {
                    window.location.href = '/login';
                });
            }
            throw error;
        }
    };
}