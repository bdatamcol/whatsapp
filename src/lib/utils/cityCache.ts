import { supabase } from '@/lib/supabase/server.supabase';

type City = {
    id: number;
    name: string;
    region_id: number;
};

let citiesCache: City[] | null = null;

export async function getAllCitiesCached(): Promise<City[]> {
    if (citiesCache) return citiesCache;

    const { data, error } = await supabase
        .from('cities')
        .select(`
      id,
      name,
      region_id
    `);

    if (error || !data) {
        return [];
    }

    // Limpieza para aplanar el objeto
    citiesCache = data.map((city) => ({
        id: city.id,
        name: city.name,
        region_id: city.region_id,
    }));

    return citiesCache;
}
