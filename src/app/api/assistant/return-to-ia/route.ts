import { NextResponse } from 'next/server';
import { returnContactToIA } from '@/lib/assistant/services/return-to-ia';

export async function POST(req: Request) {
    try {
        const { phone } = await req.json();
        const result = await returnContactToIA(phone);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
