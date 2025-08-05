import { getAssistantList } from '@/lib/admin/listAssistants';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await getUserProfile();
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const assistants = await getAssistantList(user);
        return NextResponse.json(assistants);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

