import React, { useState } from 'react';
import { PieChart, BarChart, TrendingUp, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';


import MetricsDashboard from '@/app/components/MetricsDashboard';
import AccountManager from '@/app/components/AccountManager';





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
      case 'MetricsDashboard': return <MetricsDashboard />;
      default: return null;
    }
  };
  

  return (
    <div>
      {!activeComponent ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
          {sections.map((section) => (
            <motion.div
              key={section.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveComponent(section.component)}
              className="cursor-pointer rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-shadow duration-300 p-6"
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
        <div className="p-8">
          <button onClick={() => setActiveComponent(null)} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded">
            Volver al Dashboard
          </button>
          {renderComponent()}
        </div>
      )}
    </div>
  );
};

export default MarketingDashboard;
