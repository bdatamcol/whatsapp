'use client';
import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/Button';
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
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1 md:col-span-2 p-4">
                <h2 className="text-xl font-bold mb-4">Estadísticas Generales</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="ventas" stroke="#0077FF" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Total de Leads</h3>
                    <p className="text-2xl font-bold">1,254</p>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Total de Mensajes</h3>
                    <p className="text-2xl font-bold">4,752</p>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Configuraciones Pendientes</h3>
                    <Button className="mt-2">Ir a Configuración</Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default Panel;