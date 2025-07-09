import { NextResponse } from 'next/server';
import { getContacts } from '@/lib/whatsapp/services/contacts';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const filters = {
        phone: searchParams.get('phone') || '',
        cityId: searchParams.get('city') ? Number(searchParams.get('city')) : undefined,
        status: searchParams.get('status') || '',
        human: searchParams.get('human') || '',
    };

    try {
        console.log({ filters });
        const contacts = await getContacts(filters);
        return NextResponse.json(contacts);
    } catch (error) {
        return NextResponse.json({ error: 'Error obteniendo los datos' }, { status: 500 });
    }
}
