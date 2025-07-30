'use client';

import { supabase } from '@/lib/supabase/client.supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

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
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error || !data.session) throw error || new Error('No se pudo iniciar sesión');

            const user = data.session.user;

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, company_id')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError || !profile?.role) throw new Error("Perfil no encontrado");

            // Verificar si la empresa está activa (excepto para superadmin)
            if (profile.role !== 'superadmin' && profile.company_id) {
                const { data: company, error: companyError } = await supabase
                    .from('companies')
                    .select('is_active')
                    .eq('id', profile.company_id)
                    .maybeSingle();

                if (companyError || !company) {
                    throw new Error("Error al verificar el estado de la empresa");
                }

                if (!company.is_active) {
                    // Esperar 3 segundos para que el usuario pueda leer el mensaje
                    setError('Tu empresa ha sido desactivada. Por favor, contacta al administrador del sistema.');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    await supabase.auth.signOut();
                }
            }

            document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`;

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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] animate-pulse" />
                <div className="absolute inset-0 bg-repeat" style={{ 
                    backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 0h60v60H0z" fill="none"/%3E%3Cpath d="M30 0c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM6 6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm48 0c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM30 48c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM6 54c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm48 0c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="%23ffffff" fill-opacity="0.05"/%3E%3C/svg%3E')`,
                    backgroundSize: '60px 60px'
                }} />
            </div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="z-10"
            >
                <Card className="w-[380px] bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl shadow-white/10">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <BrainCircuit className="w-12 h-12 text-gray-300" />
                        </div>
                        <CardTitle className="text-2xl text-white">Iniciar Sesión</CardTitle>
                        <p className="text-sm text-gray-300 mt-2">Accede a tu CRM + IA + META</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="Correo electrónico"
                                    required
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Contraseña"
                                    required
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                                />
                            </div>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 text-red-200 bg-red-500/20 rounded-md border border-red-500/30"
                                >
                                    <p>{error}</p>
                                </motion.div>
                            )}
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 text-white"
                                disabled={loading}
                            >
                                {loading ? 'Iniciando sesión...' : 'Acceder'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}