'use client';

import { supabase } from '@/lib/supabase/client.supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { motion } from 'framer-motion';
import { BrainCircuit, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';

function LoginFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showVerificationMessage, setShowVerificationMessage] = useState(false);

    // Manejar parámetros de URL al cargar la página
    useEffect(() => {
        const verified = searchParams.get('verified');
        const emailParam = searchParams.get('email');
        
        if (verified === 'true') {
            setShowVerificationMessage(true);
            // Limpiar la URL después de mostrar el mensaje
            setTimeout(() => {
                router.replace('/login');
            }, 5000);
        }
        
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error || !data.session) throw error || new Error('Credenciales inválidas');
            
            const cookieOptions = {
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const
            };
            
            document.cookie = `sb-access-token=${data.session.access_token}; ${Object.entries(cookieOptions).map(([k,v]) => `${k}=${v}`).join('; ')}`;
            document.cookie = `sb-refresh-token=${data.session.refresh_token}; ${Object.entries(cookieOptions).map(([k,v]) => `${k}=${v}`).join('; ')}`;
            
            const user = data.session.user;

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, company_id')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError || !profile?.role) throw new Error("Perfil no encontrado");

            if (profile.role !== 'superadmin' && profile.company_id) {
                const { data: company, error: companyError } = await supabase
                    .from('companies')
                    .select('is_active, email_verified')
                    .eq('id', profile.company_id)
                    .maybeSingle();

                if (companyError || !company) {
                    throw new Error("Error al verificar el estado de la empresa");
                }

                if (!company.email_verified) {
                    await supabase.auth.signOut();
                    setError(
                        `⚠️ Verificación de correo electrónico pendiente\n\n` +
                        `Hemos enviado un correo de verificación a ${email}. Por favor:\n` +
                        `1. Revisa tu bandeja de entrada (incluyendo spam)\n` +
                        `2. Haz clic en el enlace de verificación\n` +
                        `3. Vuelve a intentar iniciar sesión\n\n` +
                        `¿No recibiste el correo? Contacta al administrador del sistema.`
                    );
                    setLoading(false);
                    return;
                }

                if (!company.is_active) {
                    await supabase.auth.signOut();
                    setError(
                        `❌ Empresa temporalmente desactivada\n\n` +
                        `Tu empresa ha sido desactivada. Por favor contacta al administrador del sistema para más información.`
                    );
                    setLoading(false);
                    return;
                }
            }

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
            setError(error.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] animate-pulse" />
                <div className="absolute inset-0 bg-repeat" style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M30 0c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM6 6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM48 0c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM30 48c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM6 54c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM48 0c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z' fill='%23ffffff' fill-opacity='0.05'/%3E%3C/svg%3E")`,
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
                        {/* Mensaje de verificación exitosa */}
                        {showVerificationMessage && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 p-4 text-sm bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg text-green-100"
                            >
                                <div className="flex items-start space-x-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">¡Cuenta verificada exitosamente!</p>
                                        <p className="text-sm mt-1">Tu cuenta ha sido activada. Ahora puedes iniciar sesión con las credenciales que fueron enviadas a tu correo electrónico.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        
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
                                    className="p-4 text-sm bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg text-yellow-100"
                                >
                                    <div className="flex items-start space-x-3">
                                        {error.includes('⚠️') ? (
                                            <Mail className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="whitespace-pre-line">{error}</div>
                                    </div>
                                </motion.div>
                            )}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-white/10 text-white"
                            >
                                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

export default function LoginForm() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900"><div className="text-white">Cargando...</div></div>}>
            <LoginFormContent />
        </Suspense>
    );
}