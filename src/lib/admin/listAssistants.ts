import { NextResponse } from 'next/server';
import { supabase } from '../supabase/server.supabase';


export async function getAssistantList(user: any) {

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();
    if (!profile?.company_id) {
        return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('role', 'assistant')
        .eq('company_id', profile.company_id);
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return data;

}