'use client';

import { useSessionValidator } from '@/hooks/useSessionValidator';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase/client.supabase';
import { useRouter } from 'next/navigation';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  useSessionValidator(); // Validación automática de sesión
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = `sb-access-token=; max-age=0`;
    router.replace('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-6 flex flex-col">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">SuperAdmin</h1>
          <nav className="space-y-2">
            <a
              onClick={() => router.push('/superadmin-dashboard')}
              className="flex items-center p-3 text-gray-700 cursor-pointer rounded-lg hover:bg-gray-200 transition-all duration-200"
            >
              Panel de Control
            </a>
            <a
              onClick={() => router.push('/superadmin-dashboard/companies')}
              className="flex items-center p-3 text-gray-700 cursor-pointer rounded-lg hover:bg-gray-200 transition-all duration-200"
            >
              Gestión de Empresas
            </a>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="p-3 w-full flex items-center gap-3 text-left rounded-lg transition-all duration-200 text-red-400 hover:bg-red-600 hover:text-white hover:shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        {children}
      </main>
    </div>
  );
}