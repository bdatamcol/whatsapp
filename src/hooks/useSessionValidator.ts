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

        // Verificar estado del perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id, role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile) {
          router.replace('/login');
          return;
        }

        // CORREGIDO: Saltar verificación de empresa para superadmins
        if (profile.role !== 'superadmin' && profile.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('is_active, email_verified')
            .eq('id', profile.company_id)
            .maybeSingle();

          if (!company || !company.is_active || !company.email_verified) {
            await supabase.auth.signOut();
            router.replace('/login?error=email_not_verified');
            return;
          }
        }

        // Si es superadmin, no verificar empresa
        if (profile.role === 'superadmin') {
          console.log('useSessionValidator - Superadmin detectado, saltando verificación de empresa');
          return;
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

    // Reducir la frecuencia de validación para superadmins o eliminar completamente
    // CORREGIDO: Solo validar cada 30 segundos en lugar de 5
    intervalId = setInterval(validateSession, 30000);

    return () => {
      clearInterval(intervalId);
      authListener.subscription.unsubscribe();
    };
  }, [router]);
}

// Hook para forzar revalidación manual (también corregido)
export function useForceSessionCheck() {
  const router = useRouter();

  return async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        router.replace('/login');
        return false;
      }

      // Verificar perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profile) {
        router.replace('/login');
        return false;
      }

      // CORREGIDO: Solo verificar empresa para usuarios con empresa
      if (profile.role !== 'superadmin' && profile.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('is_active, email_verified')
          .eq('id', profile.company_id)
          .maybeSingle();

        if (!company || !company.is_active || !company.email_verified) {
          await supabase.auth.signOut();
          router.replace('/login?error=email_not_verified');
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