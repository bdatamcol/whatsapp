import React, { useState } from 'react';
import { PieChart, BarChart, UserCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import MetricsDashboard from '@/app/components/MetricsDashboard';
import AccountManager from './AccountManager';
import AdsManager from './AdsManager';

const sections = [
  {
    name: 'Accounts',
    description: 'Gestión de cuentas publicitarias',
    icon: <UserCheck size={24} />,
    component: 'AccountManager',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    name: 'Ads',
    description: 'Gestión de anuncios publicitarios',
    icon: <BarChart size={24} />,
    component: 'AdsManage',
    color: 'bg-green-100 text-green-800'
  },
  {
    name: 'Insights',
    description: 'Estadísticas y métricas',
    icon: <PieChart size={24} />,
    component: 'MetricsDashboard',
    color: 'bg-purple-100 text-purple-800'
  },
];

const MarketingDashboard = () => {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  const renderComponent = () => {
    switch (activeComponent) {
      case 'AccountManager': return <AccountManager />;
      case 'AdsManage': return <AdsManager />;
      case 'MetricsDashboard': return <MetricsDashboard />;
      default: return null;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Marketing Dashboard</h1>

      {!activeComponent ? (
        <div className="grid gap-6 md:grid-cols-3">
          {sections.map((section) => (
            <motion.div
              key={section.name}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveComponent(section.component)}
              className={`cursor-pointer rounded-xl p-6 shadow-sm transition-all hover:shadow-md ${section.color}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-white bg-opacity-50">
                  {section.icon}
                </div>
                <h2 className="text-xl font-bold">{section.name}</h2>
              </div>
              <p className="text-sm">{section.description}</p>
              <div className="mt-4 text-xs font-medium opacity-70">
                Click para acceder →
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <button
            onClick={() => setActiveComponent(null)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={18} />
            Volver al Dashboard
          </button>
          <div className="bg-white rounded-xl shadow-sm p-6">
            {renderComponent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingDashboard;