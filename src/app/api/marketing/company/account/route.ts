import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFacebookAccount, getCompanyFacebookPages } from '@/lib/marketing/services/company-account';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

export async function GET(request: NextRequest) {
    try {
        const profile = await getUserProfile();
        const [pages, account] = await Promise.all([
            getCompanyFacebookPages(profile.company_id),
            getCompanyFacebookAccount(profile.company_id)
        ]);
        
        return NextResponse.json({
            pages,
            account
        });
    } catch (error: any) {
        console.error('Error en /api/marketing/company/account:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}