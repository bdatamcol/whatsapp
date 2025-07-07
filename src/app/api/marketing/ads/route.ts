// app/api/marketing/ads/route.ts
import { getFacebookCampaigns } from '@/lib/marketing/services/ads';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const campaigns = await getFacebookCampaigns();
    return NextResponse.json(campaigns);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener campañas' }, { status: 500 });
  }
}
