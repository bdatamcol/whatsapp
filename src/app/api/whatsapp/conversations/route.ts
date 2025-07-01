import { supabase } from "@/lib/supabase/server.supabase";
import { NextResponse } from "next/server";


export async function GET() {

    const { data, error } = await supabase
        .from('conversations')
        .select('phone, messages, updated_at')
        .order('updated_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    const result = data.map(conv => {
        const lastMessage = conv.messages?.slice(-1)[0] || null;// obtenemos el ultimo mensaje
        
        // si lastMessage es null, entonces no hay mensajes
        if (!lastMessage) {
            return {
                phone: conv.phone,
                lastMessage: null,
                updated_at: conv.updated_at
            };
        }

        return {
            phone: conv.phone,
            lastMessage,
            updated_at: conv.updated_at
        };
    });

    return NextResponse.json(result, { status: 200 });

}