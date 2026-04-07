import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/auth/services/getUserProfile';

export default async function HomePage() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect('/login');
    }

    if (profile.role === 'admin') {
        redirect('/dashboard');
    }

    if (profile.role === 'assistant') {
        redirect('/assistant/dashboard');
    }

    if (profile.role === 'superadmin') {
        redirect('/superadmin-dashboard');
    }

    redirect('/login');
}
