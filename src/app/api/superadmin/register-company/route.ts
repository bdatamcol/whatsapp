// src/app/api/register-company/route.ts
import { registerCompany } from '@/lib/superadmin/services/register-company';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {

    try {
        const { companyName, email, password } = await req.json();
        if (!email || !password || !companyName) {
            return NextResponse.json({ error: 'Email, contraseña y nombre de empresa son requeridos' }, { status: 400 });
        }
        await registerCompany(email, password, companyName);

        return NextResponse.json({
            message: 'Empresa creada exitosamente',
        });

    } catch (error) {
        console.error('Error al crear empresa:', error);
        return NextResponse.json(
            { error: 'Error al crear la empresa' },
            { status: 500 }
        );
    }
}
