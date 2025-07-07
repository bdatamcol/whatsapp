import { getFacebookInsights } from '@/lib/marketing/services/insights';
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '20';  // Por defecto 10 campañas
  const after = searchParams.get('after') || '';    // Cursor para paginación

  try {
    const result = await getFacebookInsights(+limit, after);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error desconocido' }, { status: 500 });
  }
}
