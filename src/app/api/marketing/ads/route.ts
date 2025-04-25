// app/api/marketing/ads/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const adAccountId = process.env.MARKETING_ACCOUNT_ID;
  const version = process.env.META_API_VERSION || 'v17.0';

  if (!accessToken || !adAccountId) {
    return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 });
  }

  try {
    const url = `https://graph.facebook.com/${version}/act_${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,start_time,stop_time&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error?.message || 'Error desconocido');
    }

    return NextResponse.json({ campaigns: data.data });
  } catch (err) {
    console.error('Error al obtener campañas:', err);
    return NextResponse.json({ error: 'Error al obtener campañas' }, { status: 500 });
  }
}
