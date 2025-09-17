'use client';

import React, { useState } from 'react';
import { User, Lock, Bell, Users, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RegisterAssistantForm from '../(admin)/dashboard/assistant/RegisterAssistantForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssistantTable from '../(admin)/dashboard/assistant/AssistantTable';
import CompanyProfileEditor from './CompanyProfileEditor';
import AdminTemplatesPage from '../(admin)/dashboard/templates/page';

const settingsOptions = [
  {
    id: 'profile',
    title: 'Perfil',
    icon: <User className="w-4 h-4 mr-2" />,
    description: 'Actualiza tu información empresarial.'
  },
  {
    id: 'security',
    title: 'Seguridad',
    icon: <Lock className="w-4 h-4 mr-2" />,
    description: 'Gestiona tu contraseña y autenticación.'
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    icon: <Bell className="w-4 h-4 mr-2" />,
    description: 'Configura las alertas que recibes.'
  },
  {
    id: 'templates',
    title: 'Templates WABA',
    icon: <MessageSquare className="w-4 h-4 mr-2" />,
    description: 'Gestiona tus templates WABA.'
  },
  {
    id: 'assistants',
    title: 'Asesores',
    icon: <Users className="w-4 h-4 mr-2" />,
    description: 'Registra tus asesores'
  },
];

const Settings = () => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-screen-2xl w-full px-4 md:px-6 py-6">
        <h1 className="text-3xl md:text-4xl font-semibold mb-8">Configuración</h1>

        <Tabs defaultValue="profile" className="w-full">
          <div className="flex flex-col md:flex-row gap-6">
            <TabsList className="grid w-full md:w-64 h-fit gap-1 bg-transparent">
              {settingsOptions.map((option) => (
                <TabsTrigger
                  key={option.id}
                  value={option.id}
                  className="justify-start py-3 px-4 text-left hover:bg-gray-100"
                  onClick={() => option.id === 'assistants' && setShowDialog(true)}
                >
                  {option.icon}
                  {option.title}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 bg-white rounded-lg p-6 md:p-8 shadow-sm">
              {settingsOptions.map((option) => (
                <TabsContent key={option.id} value={option.id}>
                  <h2 className="text-2xl font-semibold mb-4">{option.title}</h2>
                  <p className="text-gray-600 mb-6">{option.description}</p>

                  {option.id === 'assistants' && <AssistantTable />}
                  {option.id === 'profile' && <CompanyProfileEditor/>}
                  {option.id === 'templates' && <AdminTemplatesPage />}
                </TabsContent>
              ))}

            </div>
          </div>
        </Tabs>

        {/* Dialog para Registrar Asistente */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Asistente</DialogTitle>
            </DialogHeader>
            <RegisterAssistantForm />
            <DialogDescription>Fixed the warning</DialogDescription>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Settings;