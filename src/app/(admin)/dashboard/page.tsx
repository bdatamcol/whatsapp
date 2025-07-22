'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client.supabase';
import Panel from '@/app/(admin)/dashboard/home/Panel';
import Leads from '@/app/components/Leads';
import Settings from '@/app/components/Settings';
import ContactList from '@/app/components/ContactList';
import WhatsAppPanel from '@/app/components/whatsapp/WhatsAppPanel';
import AssignmentsPage from './assignments/page';
import { usePendingContactsCount } from '@/hooks/usePendingContactsCount';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Target,
  Megaphone,
  UserCheck,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
import MarketingDashboard from '@/app/components/MarketingDashboard';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Panelcontrol');
  const [companyName, setCompanyName] = useState('');
  const pendingCount = usePendingContactsCount();
  const navItems = [
    { name: 'Panelcontrol', label: 'Panel de control', icon: LayoutDashboard },
    { name: 'Contactos', label: 'Contactos', icon: Users },
    { name: 'Mensajes', label: 'Mensajes', icon: MessageSquare },
    { name: 'Leads', label: 'Leads', icon: Target },
    { name: 'Marketing', label: 'Marketing', icon: Megaphone },
    { name: 'Asingar Asesor', label: 'Asignar Asesor', icon: UserCheck },
    { name: 'Ajustes', label: 'Ajustes', icon: SettingsIcon },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      // Fetch profile and company name
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('name')
          .eq('id', profile.company_id)
          .maybeSingle();

        if (company?.name) {
          setCompanyName(company.name);
        }
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Eliminar la cookie del token
    document.cookie = `sb-access-token=; max-age=0`;
    router.replace('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Panelcontrol': return <Panel />;
      case 'Contactos': return <ContactList />;
      case 'Mensajes': return <WhatsAppPanel />;
      case 'Leads': return <Leads />;
      case 'Marketing': return <MarketingDashboard />;
      case 'Asingar Asesor': return <AssignmentsPage />;
      case 'Ajustes': return <Settings />;
      default: return <Panel />;
    }
  };
  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-gray-900 text-white p-6 flex flex-col shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <LayoutDashboard className="w-6 h-6 text-blue-400" />
          <div className="text-2xl font-bold">Bdatam CRM</div>
        </div>
        {companyName && (
          <div className="text-sm text-gray-400 mb-6">{companyName}</div>
        )}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.name;
            const showBadge = item.name === 'Asingar Asesor' && pendingCount > 0;
            const Icon = item.icon;

            return (
              <TooltipProvider key={item.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab(item.name)}
                      className={`w-full flex items-center gap-3 text-left p-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-blue-700 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-sm'}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                      {showBadge && (
                        <Badge className="ml-auto bg-red-600 text-white text-xs">
                          {pendingCount}
                        </Badge>
                      )}
                    </button>
                  </TooltipTrigger>
                  {showBadge && (
                    <TooltipContent side="right">
                      <span>Tienes {pendingCount} contacto(s) sin asignar</span>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-6 p-3 w-full flex items-center gap-3 text-left rounded-lg transition-all duration-200 text-red-400 hover:bg-red-600 hover:text-white hover:shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>

      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        {renderContent()}
      </main>
    </div>
  );

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);
}