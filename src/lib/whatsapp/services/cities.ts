import { supabase } from '@/lib/supabase/server.supabase'

export async function getCitiesByRegion(regionId: number) {
    const { data, error } = await supabase
        .from('cities')
        .select('id, name')
        .eq('region_id', regionId)
        .order('name')

    if (error) throw new Error(error.message)
    return data
}
