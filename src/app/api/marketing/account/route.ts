// app/api/marketing/account/route.ts
import { getMarketingAccountInfo } from '@/lib/marketing/services/account';
import { NextResponse } from 'next/server';

// export const dynamic = 'force-dynamic'// sirve para que se ejecute en el edge cache
export async function GET() {
  try {
    const data = await getMarketingAccountInfo();
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
