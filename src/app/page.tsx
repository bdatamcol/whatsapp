'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client.supabase';
import Panel from '@/app/components/Panel';
import Leads from '@/app/components/Leads';
import Settings from '@/app/components/Settings';
import Marketing from '@/app/components/MarketingDashboard';
import WhatsAppPanel from './components/whatsapp/WhatsAppPanel';
import ContactList from './components/ContactList';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Panelcontrol');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
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
      case 'Mensajes': return <WhatsAppPanel/>;
      case 'Leads': return <Leads />;
      case 'Marketing': return <Marketing />;
      case 'Ajustes': return <Settings />;
      default: return <Panel />;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Menú lateral fijo */}
      <div className="w-64 bg-gray-800 text-white p-4 flex flex-col">
        <div className="text-2xl font-bold mb-6 p-2">📊 Bdatam CRM</div>
        <nav className="flex-1 space-y-2">
          {[
            { name: 'Panelcontrol', label: 'Panel de control' },
            { name: 'Contactos', label: 'Contactos' },
            { name: 'Mensajes', label: 'Mensajes' },
            { name: 'Leads', label: 'Leads' },
            { name: 'Marketing', label: 'Marketing' },
            { name: 'Ajustes', label: 'Ajustes' },
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeTab === item.name ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        
        {/* Botón de cierre de sesión */}
        <button
          onClick={handleLogout}
          className="mt-auto p-3 w-full text-left rounded-lg transition-colors text-red-400 hover:bg-red-500 hover:text-white"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Área de contenido principal */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {renderContent()}
      </main>
    </div>
  );
}