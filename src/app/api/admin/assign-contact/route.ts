import { NextRequest, NextResponse } from 'next/server';
import { assignContactToAssistant } from '@/lib/admin/contactAssigner';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { phone, assistantId, adminId } = body;

    try {
        if (!adminId || !assistantId || !phone) {
            return NextResponse.json({ error: 'Parámetros incompletos' }, { status: 400 });
        }
        const { error } = await assignContactToAssistant(phone, assistantId, adminId);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });

    } catch (error) {
        NextResponse.json({ error: 'Ocurrio un error al asignar' }, { status: 500 })
    }
}

