    import { supabase } from '@/lib/supabase/server.supabase'
    import { getCompanyByPhoneNumberId } from '../helpers/getCompanyByPhoneNumberId'

    interface Filters {
        phone?: string
        cityId?: number
        status?: string
        human?: string
        companyId: string
    }

    export async function getContacts(filters: Filters) {

        // 2. Iniciar la query de contactos solo de esa empresa
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
            .eq('company_id', filters.companyId) // ✅ usar directamente el companyId
            .order('created_at', { ascending: false });

        // 3. Aplicar filtros si los hay
        if (filters.phone) {
            query = query.ilike('phone', `%${filters.phone}%`);
        }

        if (filters.cityId) {
            query = query.eq('city_id', filters.cityId);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.human) {
            query = query.eq('needs_human', filters.human === 'true');
        }

        // 4. Ejecutar
        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return data;
    }

    export async function upsertContact({
        phone,
        name,
        avatar_url,
        status,
        last_interaction_at,
        phone_number_id,
    }: {
        phone: string;
        name: string;
        avatar_url: string;
        status?: string;
        last_interaction_at?: string;
        phone_number_id: string;
    }) {
        try {
            const company = await getCompanyByPhoneNumberId(phone_number_id);

            const { error } = await supabase
                .from('contacts')
                .upsert(
                    {
                        phone,
                        name,
                        avatar_url,
                        status,
                        last_interaction_at,
                        company_id: company.id,
                    },
                    { onConflict: 'phone,company_id' }
                );

            if (error) {
                console.error('Error al guardar el contacto:', error.message);
            }
        } catch (err) {
            console.error('Error en upsertContact:', err);
        }
    }


