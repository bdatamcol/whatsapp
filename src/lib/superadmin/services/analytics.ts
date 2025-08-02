import { supabase } from '@/lib/supabase/server.supabase';

export interface SuperAdminAnalytics {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalUsers: number;
  totalContacts: number;
  totalMessages: number;
  recentCompanies: Array<{
    id: string;
    name: string;
    created_at: string;
    is_active: boolean;
    admin_count: number;
  }>;
}

export async function getSuperAdminAnalytics(): Promise<SuperAdminAnalytics> {
  try {
    // Get companies data
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, created_at, is_active');

    if (companiesError) throw companiesError;

    // Get users count by role
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('role, company_id');

    if (usersError) throw usersError;

    // Get contacts count
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('company_id');

    if (contactsError) throw contactsError;

    // Get messages count (from conversations)
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, company_id');

    if (conversationsError) throw conversationsError;

    // Calculate metrics
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(c => c.is_active).length;
    const inactiveCompanies = totalCompanies - activeCompanies;
    const totalUsers = users.length;
    const totalContacts = contacts.length;
    const totalMessages = conversations.length;

    // Get recent companies with admin count
    const recentCompanies = companies
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(company => {
        const companyUsers = users.filter(u => u.company_id === company.id);
        const adminCount = companyUsers.filter(u => u.role === 'admin' || u.role === 'superadmin').length;
        
        return {
          id: company.id,
          name: company.name,
          created_at: company.created_at,
          is_active: company.is_active,
          admin_count: adminCount
        };
      });

    return {
      totalCompanies,
      activeCompanies,
      inactiveCompanies,
      totalUsers,
      totalContacts,
      totalMessages,
      recentCompanies
    };
  } catch (error) {
    console.error('Error getting superadmin analytics:', error);
    throw error;
  }
}