import { getFacebookInsights } from '@/lib/marketing/services/insights';
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const after = searchParams.get('after') || '';
  const getTotalSpend = searchParams.get('getTotalSpend') === 'true';

  try {
    const result = await getFacebookInsights({ limit, after, getTotalSpend });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error desconocido' }, { status: 500 });
  }
}
