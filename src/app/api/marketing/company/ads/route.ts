import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFacebookCampaigns } from '@/lib/marketing/services/company-ads';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

export async function GET(request: NextRequest) {
    try {
        const profile = await getUserProfile();
        
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '25');
        const after = searchParams.get('after') || undefined;
        const getSummary = searchParams.get('getSummary') === 'true';
        const filterStatus = searchParams.get('filterStatus') || undefined;
        
        const campaigns = await getCompanyFacebookCampaigns(profile.company_id, {
            limit,
            after,
            getSummary,
            filterStatus
        });
        
        return NextResponse.json(campaigns);
    } catch (error: any) {
        console.error('Error en /api/marketing/company/ads:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}