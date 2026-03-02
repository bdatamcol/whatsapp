import { NextRequest, NextResponse } from 'next/server';
import {
    getCompanyFacebookCampaignAds,
    getCompanyFacebookCampaignInsights,
} from '@/lib/marketing/services/company-ads';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

export async function GET(
    request: NextRequest,
    { params }: { params: { campaignId: string } }
) {
    try {
        const profile = await getUserProfile();
        const { campaignId } = await params;

        const { searchParams } = new URL(request.url);
        const since = searchParams.get('since') || undefined;
        const until = searchParams.get('until') || undefined;
        const limit = parseInt(searchParams.get('limit') || '50');

        const [ads, insights] = await Promise.all([
            getCompanyFacebookCampaignAds(profile.company_id, campaignId, { limit }),
            getCompanyFacebookCampaignInsights(profile.company_id, campaignId, { since, until }),
        ]);

        const activeAds = (ads.data || []).filter((ad: any) => {
            const status = String(ad.effective_status || ad.status || '').toUpperCase();
            return status === 'ACTIVE';
        }).length;

        return NextResponse.json({
            insights,
            ads: ads.data || [],
            activeAds,
            totalAds: ads.data?.length || 0,
        });
    } catch (error: any) {
        console.error('Error en /api/marketing/company/campaigns/[campaignId]/details:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
