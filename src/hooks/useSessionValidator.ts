import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client.supabase';

export function useSessionValidator() {
  const router = useRouter();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const validateSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          // Sesión inválida, redirigir inmediatamente
          router.replace('/login');
          return;
        }

        // Verificar estado de la empresa
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id, role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile) {
          router.replace('/login');
          return;
        }

        // Verificar empresa para usuarios no superadmin
        if (profile.role !== 'superadmin' && profile.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('is_active')
            .eq('id', profile.company_id)
            .maybeSingle();

          if (!company || !company.is_active) {
            // Empresa desactivada, cerrar sesión
            await supabase.auth.signOut();
            router.replace('/login');
            return;
          }
        }
      } catch (error) {
        console.error('Session validation error:', error);
        router.replace('/login');
      }
    };

    // Validar inmediatamente al montar
    validateSession();

    // Configurar listener para cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    // Validar cada 5 segundos para detectar cambios rápidos
    intervalId = setInterval(validateSession, 5000);

    return () => {
      clearInterval(intervalId);
      authListener.subscription.unsubscribe();
    };
  }, [router]);
}

// Hook para forzar revalidación manual
export function useForceSessionCheck() {
  const router = useRouter();

  return async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.replace('/login');
        return false;
      }

      // Verificar empresa
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profile) {
        router.replace('/login');
        return false;
      }

      if (profile.role !== 'superadmin' && profile.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('is_active')
          .eq('id', profile.company_id)
          .maybeSingle();

        if (!company || !company.is_active) {
          await supabase.auth.signOut();
          router.replace('/login');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Force session check error:', error);
      router.replace('/login');
      return false;
    }
  };
}