import { NextResponse } from 'next/server';

interface Metric {
  dateStart: string;
  dateStop: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  uniqueClicks: number;
  cpc: number;
  ctr: number;
  frequency: number;
  campaignName: string;
  adsetName: string;
  adName: string;
  effectiveStatus: string;
  actions: { actionType: string; value: number }[];
}

export async function GET(request: Request) { 
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '20';  // Por defecto 10 campañas
  const after = searchParams.get('after') || '';    // Cursor para paginación

  try {
    const url = `https://graph.facebook.com/v17.0/act_${process.env.FACEBOOK_AD_ACCOUNT_ID}/insights` +
      `?fields=date_start,date_stop,spend,impressions,reach,clicks,unique_clicks,cpc,ctr,frequency,campaign_name,adset_name,ad_name,actions` +
      `&level=ad` +
      `&limit=${limit}` +
      `&access_token=${process.env.FACEBOOK_ACCESS_TOKEN}` +
      (after ? `&after=${after}` : '');

    const response = await fetch(url, { method: 'GET' });

    console.log('Status Code:', response.status);

    if (!response.ok) {
      const errorMessage = await response.json();
      console.log('Error Message:', errorMessage);
      return NextResponse.json({ error: errorMessage.error.message }, { status: 500 });
    }

    const data = await response.json();
    console.log('Datos recibidos:', data);

    const formattedData: Metric[] = data.data.map((entry: any) => ({
      dateStart: entry.date_start || 'N/A',
      dateStop: entry.date_stop || 'N/A',
      spend: parseFloat(entry.spend) || 0,
      impressions: parseInt(entry.impressions) || 0,
      reach: parseInt(entry.reach) || 0,
      clicks: parseInt(entry.clicks) || 0,
      uniqueClicks: parseInt(entry.unique_clicks) || 0,
      cpc: parseFloat(entry.cpc) || 0,
      ctr: parseFloat(entry.ctr) || 0,
      frequency: parseFloat(entry.frequency) || 0,
      campaignName: entry.campaign_name || 'N/A',
      adsetName: entry.adset_name || 'N/A',
      adName: entry.ad_name || 'N/A',
      effectiveStatus: entry.effective_status || 'N/A',
      actions: entry.actions ? entry.actions.map((action: any) => ({
        actionType: action.action_type || 'N/A',
        value: parseInt(action.value) || 0,
      })) : []
    }));

    return NextResponse.json({ data: formattedData, paging: data.paging });
  } catch (error: any) {
    console.error('Error interno:', error.message || error);
    return NextResponse.json({ error: error.message || 'Error desconocido' }, { status: 500 });
  }
}
