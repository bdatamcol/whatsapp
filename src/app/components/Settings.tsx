import React, { useState } from 'react';
import { User, Lock, Bell, Globe } from 'lucide-react';

const settingsOptions = [
  { title: 'Perfil', icon: <User className="w-6 h-6" />, description: 'Actualiza tu información personal.' },
  { title: 'Seguridad', icon: <Lock className="w-6 h-6" />, description: 'Gestiona tu contraseña y autenticación.' },
  { title: 'Notificaciones', icon: <Bell className="w-6 h-6" />, description: 'Configura las alertas que recibes.' },
  { title: 'Preferencias', icon: <Globe className="w-6 h-6" />, description: 'Ajusta idioma y tema.' },
];

const Settings = () => {
  const [selected, setSelected] = useState(0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Ajustes</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {settingsOptions.map((option, index) => (
          <div
            key={index}
            onClick={() => setSelected(index)}
            className={`flex items-center p-4 rounded-xl shadow-md transition-all cursor-pointer 
              ${selected === index ? 'bg-blue-100 border border-blue-500 shadow-lg' : 'bg-white'} 
              hover:bg-blue-50 hover:shadow-lg hover:scale-105`}
          >
            <div className="mr-4 text-blue-600">
              {option.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{option.title}</h2>
              <p className="text-gray-600">{option.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
