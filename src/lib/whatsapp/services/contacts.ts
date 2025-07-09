import { supabase } from '@/lib/supabase/server.supabase'

interface Filters {
    phone?: string
    cityId?: number
    status?: string
    human?: string
}

export async function getContacts(filters: Filters) {
    let query = supabase
        .from('contacts')
        .select(`
      name,
      phone,
      avatar_url,
      tags,
      status,
      needs_human,
      cities(name)
    `)
        .order('created_at', { ascending: false })

    if (filters.phone) {
        query = query.ilike('phone', `%${filters.phone}%`)
    }

    if (filters.cityId) {
        query = query.eq('city_id', filters.cityId)
    }

    if (filters.status) {
        query = query.eq('status', filters.status)
    }

    if (filters.human) {
        query = query.eq('needs_human', filters.human === 'true')
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)

    return data
}

