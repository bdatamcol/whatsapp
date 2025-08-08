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
                is_active,
                email_verified,
                prompt,
                admins:profiles!left(id, email, is_active, role),
                assistants:profiles!left(id, email, is_active, deleted_at, role)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedData = data.map(company => {
            const { admins, assistants, ...companyData } = company;
            return {
                ...companyData,
                admins: admins.filter(a => a.role === 'admin').map(admin => ({
                    id: admin.id,
                    email: admin.email,
                    is_active: admin.is_active
                })),
                assistants: assistants.filter(a => a.role === 'assistant').map(assistant => ({
                    id: assistant.id,
                    email: assistant.email,
                    is_active: assistant.is_active,
                    deleted_at: assistant.deleted_at
                })),
                stats: {
                    totalAssistants: assistants.filter(a => a.role === 'assistant').length,
                    activeAssistants: assistants.filter(a => a.role === 'assistant' && a.is_active && !a.deleted_at).length,
                    deletedAssistants: assistants.filter(a => a.role === 'assistant' && a.deleted_at).length
                }
            };
        });

        return { companies: formattedData };
    } catch (error) {
        console.error('Error al listar empresas:', error);
        throw error;
    }
}