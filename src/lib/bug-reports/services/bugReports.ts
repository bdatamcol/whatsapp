import { supabase } from '@/lib/supabase/server.supabase';

export interface BugReport {
  id?: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reporter_email?: string;
  user_id?: string;
  company_id?: string;
  role?: 'admin' | 'assistant' | 'superadmin' | 'anonymous';
  browser_info?: string;
  device_info?: string;
  os_info?: string;
  url?: string;
  screenshot_url?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface BugReportFilters {
  status?: string;
  category?: string;
  priority?: string;
  company_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

export async function createBugReport(report: Omit<BugReport, 'id' | 'created_at' | 'updated_at'>): Promise<BugReport> {
  const { data, error } = await supabase
    .from('bug_reports')
    .insert(report)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating bug report: ${error.message}`);
  }

  return data;
}

export async function getBugReports(filters: BugReportFilters = {}): Promise<BugReport[]> {
  let query = supabase
    .from('bug_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.priority) query = query.eq('priority', filters.priority);
  if (filters.company_id) query = query.eq('company_id', filters.company_id);
  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  if (filters.date_from) query = query.gte('created_at', filters.date_from);
  if (filters.date_to) query = query.lte('created_at', filters.date_to);

  const { data, error } = await query;
  if (error) throw new Error(`Error fetching bug reports: ${error.message}`);
  return data || [];
}

export async function updateBugReport(id: string, updates: Partial<BugReport>): Promise<BugReport> {
  const { data, error } = await supabase
    .from('bug_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error updating bug report: ${error.message}`);
  return data;
}

export async function getBugReportStats(): Promise<any> {
  const { data, error } = await supabase
    .from('bug_reports')
    .select('status, priority, category');

  if (error) throw new Error(`Error fetching stats: ${error.message}`);

  const stats = {
    total: data.length,
    open: 0, in_progress: 0, resolved: 0, closed: 0,
    by_priority: {}, by_category: {},
  };

  data.forEach(report => {
    stats[report.status]++;
    stats.by_priority[report.priority] = (stats.by_priority[report.priority] || 0) + 1;
    stats.by_category[report.category] = (stats.by_category[report.category] || 0) + 1;
  });

  return stats;
}