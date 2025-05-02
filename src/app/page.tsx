'use client';

import { useState } from 'react';
import Panel from '@/app/components/Panel';
import Leads from '@/app/components/Leads';
import Settings from '@/app/components/Settings';
import Messagess from '@/app/components/Messagess';
import Marketing from '@/app/components/MarketingDashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState('Panelcontrol');
  
  const renderContent = () => {
    switch (activeTab) {
      case 'Panelcontrol': return <Panel />;
      case 'Mensajes': return <Messagess />;
      case 'Leads': return <Leads />;
      case 'Ajustes': return <Settings />;
      case 'Marketing': return <Marketing />;
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
            { name: 'Mensajes', label: 'Mensajes' },
            { name: 'Leads', label: 'Leads' },
            { name: 'Ajustes', label: 'Ajustes' },
            { name: 'Marketing', label: 'Marketing' }
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
      </div>

      {/* Área de contenido principal */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {renderContent()}
      </main>
    </div>
  );
}