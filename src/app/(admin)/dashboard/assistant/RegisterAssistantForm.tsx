'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';

export default function RegisterAssistantForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!email || !password) {
            toast.error('Completa todos los campos');
            return;
        }

        setLoading(true);
        const res = await fetch('/api/admin/register-assistant', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        setLoading(false);

        if (res.ok) {
            toast.success('Asistente registrado con éxito');
            setEmail('');
            setPassword('');
        } else {
            toast.error(data.error || 'Ocurrió un error');
        }
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleRegister();
            }}
            className="space-y-4"
        >
            <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo del asistente
                </label>
                <Input
                    id="email"
                    type="email"
                    placeholder="asistente@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                </label>
                <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <Button
                type="submit"
                className="w-full"
                disabled={loading}
            >
                {loading ? 'Registrando...' : 'Registrar'}
            </Button>
        </form>
    );
}
