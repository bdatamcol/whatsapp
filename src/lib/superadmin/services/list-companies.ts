import { supabase } from '@/lib/supabase/server.supabase';

export async function listCompanies() {
    try {
        const { data, error } = await supabase
            .from('companies')
            .select(`
                id,
                name,
                whatsapp_number,
                created_at,
                admins:profiles!left(id, email)
            `)
        if (error) throw error;

        // Formatear los datos para tener una estructura más limpia
        const formattedData = data.map(company => {
            const { admins, ...companyData } = company;
            return {
                ...companyData,
                admins: admins.map((admin: any) => ({
                    id: admin.id,
                    email: admin.email
                }))
            };
        });

        return { companies: formattedData };
    } catch (error) {
        console.error('Error al listar empresas:', error);
        throw error;
    }
}