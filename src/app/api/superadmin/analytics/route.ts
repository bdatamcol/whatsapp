import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';
import { getSuperAdminAnalytics } from '@/lib/superadmin/services/analytics';

export async function GET(req: NextRequest) {
    try {
        // Verify superadmin access
        const profile = await getUserProfile(req);
        if (!profile || profile.role !== 'superadmin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Get analytics data
        const analytics = await getSuperAdminAnalytics();
        
        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error getting analytics:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}