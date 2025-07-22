'use client';

import { supabase } from '@/lib/supabase/client.supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';

export default function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Iniciar sesión
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error || !data.session) throw error || new Error('No se pudo iniciar sesión');

            // 2. Obtener el perfil usando el id del usuario autenticado
            const user = data.session.user;

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError || !profile?.role) throw new Error("Perfil no encontrado");
            // Guardar el token en una cookie
            document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 días

            // 3. Redirigir según el rol
            if (profile.role === 'admin') {
                router.replace('/dashboard');
            } else if (profile.role === 'assistant') {
                router.replace('/assistant/dashboard');
            } else if (profile.role === 'superadmin') {
                router.replace('/superadmin-dashboard');
            } else {
                throw new Error('Rol desconocido');
            }

        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Iniciar Sesión</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Email"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Contraseña"
                                required
                            />
                        </div>
                        {error && (
                            <div className="p-4 text-red-500 bg-red-100 rounded-md">
                                <p>{error}</p>
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}