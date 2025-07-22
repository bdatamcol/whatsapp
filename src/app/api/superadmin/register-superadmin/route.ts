// src/app/api/superadmin/register-superadmin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { registerSuperadmin } from '@/lib/superadmin/services/register-superadmin';

// Esta ruta debe estar protegida por una clave secreta o un token especial
// ya que es extremadamente sensible
export async function POST(req: NextRequest) {
    try {
        // Verificar la clave secreta para esta operación
        const authHeader = req.headers.get('authorization');
        const secretKey = process.env.SUPERADMIN_CREATION_SECRET;
        
        if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
        }

        // Registrar el superadmin
        return await registerSuperadmin(email, password);

    } catch (error) {
        console.error('Error al registrar superadmin:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}