import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFacebookInsights } from '@/lib/marketing/services/company-insights';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

export async function GET(request: NextRequest) {
    try {
        const profile = await getUserProfile();
        
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const after = searchParams.get('after') || undefined;
        const getTotalSpend = searchParams.get('getTotalSpend') === 'true';
        const since = searchParams.get('since') || undefined;
        const until = searchParams.get('until') || undefined;
        
        const insights = await getCompanyFacebookInsights(profile.company_id, {
            limit,
            after,
            getTotalSpend,
            since,
            until
        });
        
        return NextResponse.json(insights);
    } catch (error: any) {
        console.error('Error en /api/marketing/company/insights:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}