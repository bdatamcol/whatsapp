import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server.supabase';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';
import { CompanyMessengerTokenService } from '@/lib/messenger/services/company-token-service';

export async function GET(request: NextRequest) {
  try {
    const profile = await getUserProfile();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId') || undefined;

    const dbCheck = await supabase
      .from('messenger_messages')
      .select('id', { count: 'exact', head: true });

    const db = {
      ok: !dbCheck.error,
      count: dbCheck.count ?? null,
      error: dbCheck.error
        ? (dbCheck.error.message || dbCheck.error.details || dbCheck.error.code || 'unknown_db_error')
        : null,
    };

    let token: any = null;
    if (pageId) {
      const accessToken = await CompanyMessengerTokenService.getPageAccessToken(profile.company_id, pageId);
      token = {
        pageId,
        found: !!accessToken,
      };
    }

    return NextResponse.json({
      success: true,
      db,
      token,
      companyId: profile.company_id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Error interno' },
      { status: 500 }
    );
  }
}
