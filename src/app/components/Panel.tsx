'use client';
import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import Button from '@/app/components/ui/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Panel: React.FC = () => {
  const data = [
    { name: 'Lun', ventas: 400 },
    { name: 'Mar', ventas: 300 },
    { name: 'Mié', ventas: 500 },
    { name: 'Jue', ventas: 700 },
    { name: 'Vie', ventas: 600 },
    { name: 'Sáb', ventas: 800 },
    { name: 'Dom', ventas: 400 },
  ];

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Panel de Control</h1>
        <p className="text-gray-600">Resumen general de tu CRM</p>
      </header>

      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Estadísticas Generales</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="ventas" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Total de Leads</h3>
              <p className="text-2xl font-bold text-blue-600">1,254</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Total de Mensajes</h3>
              <p className="text-2xl font-bold text-blue-600">4,752</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Configuraciones Pendientes</h3>
                <p className="text-gray-600">3 tareas por completar</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Ir a Configuración
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Panel;