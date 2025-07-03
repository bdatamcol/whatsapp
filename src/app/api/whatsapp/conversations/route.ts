import { supabase } from "@/lib/supabase/server.supabase";
import { NextResponse } from "next/server";

export async function GET() {

    try {

        const { data, error } = await supabase
            .from("conversations")
            .select(`
      phone,
      messages,
      updated_at,
      contacts (
        name,
        avatar_url
      )
    `)
            .order("updated_at", { ascending: false });

        if (error || !data) {
            return NextResponse.json({ error: error?.message || 'Sin datos' }, { status: 500 });
        }

        const result = data.map((conv: any) => {
            const lastMessage = conv.messages?.slice(-1)[0] || null;
            const contact = conv.contacts;

            return {
                phone: conv.phone,
                lastMessage,
                updated_at: conv.updated_at,
                name: contact?.name || conv.phone,
                avatar_url: contact.avatar_url || null,
            };
        });

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }

}