import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFacebookAdSets } from '@/lib/marketing/services/company-ads';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

export async function GET(
    request: NextRequest,
    { params }: { params: { campaignId: string } }
) {
    try {
        const profile = await getUserProfile();
        const { campaignId } = params;
        
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '25');
        const after = searchParams.get('after') || undefined;
        const filterStatus = searchParams.get('filterStatus') || undefined;
        
        const adSets = await getCompanyFacebookAdSets(profile.company_id, campaignId, {
            limit,
            after,
            filterStatus
        });
        
        return NextResponse.json(adSets);
    } catch (error: any) {
        console.error('Error en /api/marketing/company/campaigns/[campaignId]/adsets:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
