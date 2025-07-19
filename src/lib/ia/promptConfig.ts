import { supabase } from '@/lib/supabase/server.supabase';

export async function getPromptByEmpresaId(companyId: string): Promise<string> {
    const { data, error } = await supabase
        .from('companies')
        .select('prompt')
        .eq('id', companyId)
        .maybeSingle();

    if (error || !data?.prompt) {
        console.warn('[Prompt] No se encontró prompt personalizado para la empresa. Usando uno por defecto.');
        return 'Eres un asistente virtual amigable y profesional. Responde de forma clara y concisa.';
    }

    return data.prompt;
}
