'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    LogOut,
    SquareStack,
} from 'lucide-react';
import Button from '@/app/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAssignedContactsCount } from '@/hooks/useAssignedContactsCount';
import { useSessionValidator } from '@/hooks/useSessionValidator';
import { supabase } from '@/lib/supabase/client.supabase';

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const assignedCount = useAssignedContactsCount();
    
    useSessionValidator(); // Validación automática de sesión

    const handleLogout = async () => {
        await supabase.auth.signOut();
        document.cookie = `sb-access-token=; max-age=0`;
        router.replace('/login');
    };

    const sidebarItems = [
        {
            href: '/assistant/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            showBadge: true,
        },
        {
            href: '/assistant/history',
            label: 'Historial',
            icon: SquareStack,
            showBadge: false,
        },
    ];

    return (
        <TooltipProvider>
            <div className="flex min-h-screen">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r p-6 flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-bold mb-6">Panel del Asistente</h2>
                        <nav className="space-y-2">
                            {sidebarItems.map(({ href, label, icon: Icon, showBadge }) => {
                                const active = pathname.startsWith(href);
                                const show = showBadge && assignedCount > 0;

                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 rounded transition-colors relative',
                                            active ? 'bg-gray-100 text-black font-semibold' : 'text-gray-600 hover:bg-gray-50'
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{label}</span>

                                        {show && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge 
                                                        className="ml-auto text-white bg-red-500 hover:bg-red-600 animate-pulse"
                                                        style={{ animationDuration: '2s' }}
                                                    >
                                                        {assignedCount}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">
                                                    <p>
                                                        {`Tienes ${assignedCount} contacto${assignedCount > 1 ? 's' : ''} asignado${assignedCount > 1 ? 's' : ''}`}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Cerrar sesión</span>
                    </Button>
                </aside>

                <main className="flex-1 bg-gray-50 p-6 overflow-auto">{children}</main>
            </div>
        </TooltipProvider>
    );
}
