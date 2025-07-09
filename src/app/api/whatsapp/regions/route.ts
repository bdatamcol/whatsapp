import { NextResponse } from 'next/server';
import { getRegions } from '@/lib/whatsapp/services/regions';


export async function GET() {
    try {

        const regions = await getRegions();
        return NextResponse.json(regions);
        
    } catch (error) {
        NextResponse.json({error: 'Error obteniendo regiones'}, {status: 500})
    }
}