import { registerAdmin } from '@/lib/auth/services/register';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        const user = await registerAdmin(email, password);

        return NextResponse.json({
            message: 'Administrador creado exitosamente',
            user: { id: user.id, email: user.email }
        });

    } catch (error) {
        console.error('Error al crear administrador:', error);
        return NextResponse.json(
            { error: 'Error al crear el administrador' },
            { status: 500 }
        );
    }
}