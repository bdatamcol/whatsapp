import { NextResponse } from "next/server";
import { getAllConversationsSummary } from "@/lib/whatsapp/services/conversation";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');

        if (!companyId) {
            return NextResponse.json({ error: 'Falta companyId' }, { status: 400 });
        }

        const conversations = await getAllConversationsSummary(companyId);
        return NextResponse.json(conversations, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
