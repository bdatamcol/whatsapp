// src/app/api/register-company/route.ts
import { registerCompany } from '@/lib/superadmin/services/register-company';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {

    try {
        const { companyName, whatsappNumber, email, password } = await req.json();
        if (!email || !password || !companyName || !whatsappNumber) {
            return NextResponse.json({ error: 'Email, contraseña, nombre de empresa y número de WhatsApp son requeridos' }, { status: 400 });
        }
        await registerCompany(email, password, companyName, whatsappNumber);

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
