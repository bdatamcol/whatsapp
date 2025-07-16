import { getAssistantList } from '@/lib/admin/listAssistants';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';
import { NextResponse } from 'next/server';

export async function GET() {


    try {
        const user = await getUserProfile();
        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }
        const assistants = await getAssistantList(user);

        return NextResponse.json(assistants, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'Error creando usuario' }, { status: 500 });
    }

}
