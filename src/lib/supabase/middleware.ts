import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getValidSession() {
  const cookieStore = cookies();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  // Get session from cookies
  const accessToken = (await cookieStore).get('sb-access-token')?.value;
  const refreshToken = (await cookieStore).get('sb-refresh-token')?.value;
  
  if (!accessToken) {
    return null;
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return null;
  }

  // Verificar estado de la empresa
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', session.user.id)
    .single();

  if (!profile || !profile.company_id) {
    return null;
  }

  // Verificar si la empresa está activa
  if (profile.role !== 'superadmin') {
    const { data: company } = await supabase
      .from('companies')
      .select('is_active')
      .eq('id', profile.company_id)
      .single();

    if (!company || !company.is_active) {
      return null;
    }
  }

  return session;
}

export async function requireAuth() {
  const session = await getValidSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireAuth();
  
  const cookieStore = cookies();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'superadmin') {
    redirect('/login');
  }

  return session;
}