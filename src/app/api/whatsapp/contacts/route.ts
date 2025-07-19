import { NextResponse } from 'next/server';
import { getContacts } from '@/lib/whatsapp/services/contacts';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

export async function GET(request: Request) {
    const profile = await getUserProfile(request);
    if (!profile?.company_id) {
        return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
        companyId: profile.company_id, // <-- clave para filtrar
        phone: searchParams.get('phone') || '',
        cityId: searchParams.get('city') ? Number(searchParams.get('city')) : undefined,
        status: searchParams.get('status') || '',
        human: searchParams.get('human') || '',
    };

    try {
        const contacts = await getContacts(filters);
        return NextResponse.json(contacts);
    } catch (error) {
        console.error('Error al obtener contactos:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
