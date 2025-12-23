import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFacebookLeadsFromAd } from '@/lib/marketing/services/company-ads';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

export async function GET(
    request: NextRequest,
    { params }: { params: { adId: string } }
) {
    try {
        const profile = await getUserProfile();
        const { adId } = await params;
        
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const after = searchParams.get('after') || undefined;
        
        const leads = await getCompanyFacebookLeadsFromAd(profile.company_id, adId, {
            limit,
            after
        });
        
        return NextResponse.json(leads);
    } catch (error: any) {
        console.error('Error en /api/marketing/company/ads/[adId]/leads:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}