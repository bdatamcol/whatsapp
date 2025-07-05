import { supabase } from "@/lib/supabase/server.supabase";
import { NextResponse } from "next/server";


export const handleStatusEvent = async (statusEvent: any): Promise<NextResponse | null> => {

    const { id: messageId, recipient_id: recipient, status } = statusEvent;

    if (status === 'read') {
        // Llamar a una función de supabase si guardas estado
        await supabase.rpc('mark_message_as_read', {
            phone_input: recipient,
            message_id: messageId
        });
        return NextResponse.json({ status: 'Estado leído registrado' });
    } else {
        return NextResponse.json({ status: `Evento de estado ignorado: ${status}` });
    }
}