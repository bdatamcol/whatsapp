import React, { useState } from 'react';
import { PieChart, BarChart, UserCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import MetricsDashboard from '@/app/components/MetricsDashboard';
import AccountManager from '@/app/components/AccountManager';
import AdsManage from '@/app/components/AdsManage';

const sections = [
  { name: 'Accounts', description: 'Gestión de cuentas publicitarias', icon: <UserCheck size={40} />, component: 'AccountManager' },
  { name: 'Ads', description: 'Gestión de anuncios publicitarios', icon: <BarChart size={40} />, component: 'AdsManage' },
  { name: 'Insights', description: 'Estadísticas y métricas', icon: <PieChart size={40} />, component: 'MetricsDashboard' },
];

const MarketingDashboard = () => {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  const renderComponent = () => {
    switch (activeComponent) {
      case 'AccountManager': return <AccountManager />;
      case 'AdsManage': return <AdsManage />;
      case 'MetricsDashboard': return <MetricsDashboard />;
      default: return null;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Marketing</h1>
      
      {!activeComponent ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <motion.div
              key={section.name}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveComponent(section.component)}
              className="cursor-pointer rounded-xl bg-white p-4 shadow-md transition-all hover:shadow-lg"
            >
              <div className="text-center mb-4">
                {section.icon}
              </div>
              <h2 className="text-xl font-bold mb-2">{section.name}</h2>
              <p className="text-sm text-gray-600">{section.description}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button 
            onClick={() => setActiveComponent(null)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <ArrowLeft size={18} />
            Volver al Dashboard
          </button>
          <div className="bg-white rounded-lg shadow-sm p-4">
            {renderComponent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingDashboard;