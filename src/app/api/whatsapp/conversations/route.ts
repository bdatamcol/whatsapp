import { NextResponse } from "next/server";
import { getAllConversationsSummary } from "@/lib/whatsapp/services/conversation";

export async function GET() {

    try {

        const conversations = await getAllConversationsSummary();
        return NextResponse.json(conversations, { status: 200});

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }

}