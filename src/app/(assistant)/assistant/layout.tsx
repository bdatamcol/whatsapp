// (assistant)/assistant/layout.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    MessageSquare,
    Settings as SettingsIcon
} from 'lucide-react';

const sidebarItems = [
    { href: '/assistant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/assistant/chat', label: 'Chats', icon: MessageSquare },
    { href: '/assistant/settings', label: 'Configuración', icon: SettingsIcon },
];

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r p-6 space-y-4">
                <h2 className="text-xl font-bold mb-6">Panel del Asistente</h2>
                <nav className="space-y-2">
                    {sidebarItems.map(({ href, label, icon: Icon }) => {
                        const active = pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded transition-colors',
                                    active ? 'bg-gray-100 text-black font-semibold' : 'text-gray-600 hover:bg-gray-50'
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 bg-gray-50 p-6 overflow-auto">{children}</main>
        </div>
    );
}
