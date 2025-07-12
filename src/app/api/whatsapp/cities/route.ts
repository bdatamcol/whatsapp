import { NextRequest, NextResponse } from 'next/server';
import { getCitiesByRegion } from '@/lib/whatsapp/services/cities';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const regionId = await searchParams.get('region_id');
    try {
        if (!regionId) return NextResponse.json({ error: 'Missing region_id' }, { status: 400 })
        const cities = await getCitiesByRegion(Number(regionId));
        return NextResponse.json(cities);

    } catch (error) {

    }
}
