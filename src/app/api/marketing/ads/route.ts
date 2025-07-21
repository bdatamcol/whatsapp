// app/api/marketing/ads/route.ts
import { getFacebookCampaigns } from '@/lib/marketing/services/ads';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '25');
  const after = searchParams.get('after') || undefined;
  const getSummary = searchParams.get('getSummary') === 'true';
  const filterStatus = searchParams.get('filterStatus') || undefined;

  try {
    const result = await getFacebookCampaigns({ limit, after, getSummary, filterStatus });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener campañas' }, { status: 500 });
  }
}
