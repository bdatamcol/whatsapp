import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFacebookAds } from '@/lib/marketing/services/company-ads';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

export async function GET(
    request: NextRequest,
    { params }: { params: { adsetId: string } }
) {
    try {
        const profile = await getUserProfile();
        const { adsetId } = await params;
        
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '25');
        const after = searchParams.get('after') || undefined;
        const filterStatus = searchParams.get('filterStatus') || undefined;
        
        const ads = await getCompanyFacebookAds(profile.company_id, adsetId, {
            limit,
            after,
            filterStatus
        });
        
        return NextResponse.json(ads);
    } catch (error: any) {
        console.error('Error en /api/marketing/company/adsets/[adsetId]/ads:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}