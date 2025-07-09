import { supabase } from '@/lib/supabase/server.supabase'

export async function getRegions() {
    const { data, error } = await supabase.from('regions').select('id, name').order('name')
    if (error) throw new Error(error.message)
    return data
}
