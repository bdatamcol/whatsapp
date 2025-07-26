import { NextResponse } from 'next/server';
import { returnContactToIA } from '@/lib/assistant/services/return-to-ia';

export async function POST(req: Request) {
    try {
        const { phone, companyId } = await req.json();
        
        if (!phone || !companyId) {
            return NextResponse.json({ error: 'Faltan datos requeridos: phone y companyId' }, { status: 400 });
        }
        
        const result = await returnContactToIA(phone, companyId);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
