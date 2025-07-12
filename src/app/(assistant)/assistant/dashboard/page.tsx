//dashboard para el asistente
'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client.supabase';
import { getCurrentUserClient } from '@/lib/auth/services/getUserFromRequest';
import { toast } from 'sonner';
import Link from 'next/link';
import Card from '@/app/components/ui/card';

type Contact = {
  id: number;
  name: string;
  phone: string;
};

export default function AssistantDashboard() {

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [newPhones, setNewPhones] = useState<Set<string>>(new Set());

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const user = await getCurrentUserClient();
      if (!user?.id) return;

      setUserId(user.id);

      // Obtener contactos asignados al cargar
      const { data: existing, error } = await supabase
        .from('assistants_assignments')
        .select('contact:contact_phone(name, phone)')
        .eq('assigned_to', user.id)
        .eq('active', true);

      if (!error && existing) {
        const mapped = existing.map((a: any) => a.contact);
        setContacts(mapped);
      }

      // Realtime: escuchar nuevas asignaciones
      channel = supabase
        .channel('realtime-assistant-assignments')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'assistants_assignments',
            filter: `assigned_to=eq.${user.id}`,
          },
          async (payload) => {
            const newPhone = payload.new.contact_phone;

            toast.info(`Nuevo contacto asignado: ${newPhone}`);

            const { data: contact, error } = await supabase
              .from('contacts')
              .select('name, phone')
              .eq('phone', newPhone)
              .maybeSingle();

            if (contact && !error) {
              setContacts((prev: any) => [...prev, contact]);
              setNewPhones((prev) => new Set(prev).add(contact.phone));
              setTimeout(() => {
                setNewPhones(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(contact.phone);
                  return newSet;
                });
              }, 10000);
            }
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Tus chats asignados</h1>

        {contacts.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No tienes chats asignados actualmente
          </p>
        ) : (
          <div className="space-y-3">
            {contacts.map(c => (
              <Link
                key={c.phone}
                href={`/assistant/chat/${c.phone}`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div>
                  <p className="font-medium">{c.name || 'Contacto sin nombre'}</p>
                  <p className="text-sm text-muted-foreground">{c.phone}</p>
                </div>
                {newPhones.has(c.phone) && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Nuevo
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  // return (
  //   <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
  //     <div className="flex items-center justify-between space-y-2">
  //       <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
  //     </div>
  //     <div className="space-y-4">
  //       <div className="border-b">
  //         <div className="flex space-x-4">
  //           <button className="px-4 py-2 text-sm font-medium border-b-2 border-black">Overview</button>
  //           <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-black">Chats</button>
  //           <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-black">Settings</button>
  //         </div>
  //       </div>
  //       <div className="space-y-4">
  //         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  //           <div className="rounded-lg border p-4">
  //             <div className="flex flex-row items-center justify-between space-y-0 pb-2">
  //               <div className="text-sm font-medium">
  //                 Total Chats
  //               </div>
  //             </div>
  //             <div className="rounded-lg border p-4 col-span-full">
  //               <h3 className="text-lg font-semibold mb-2">Contactos asignados</h3>
  //               {contacts.length === 0 ? (
  //                 <p className="text-gray-500 text-sm">No tienes contactos asignados aún.</p>
  //               ) : (
  //                 <ul className="text-sm space-y-1">
  //                   {contacts.map(c => (
  //                     <li key={c.phone} className="flex justify-between items-center">
  //                       <Link href={`/assistant/chat/${c.phone}`} className="flex justify-between w-full hover:underline">
  //                         <span>{c.name || 'Sin nombre'}</span>
  //                         <div className="flex items-center gap-2">
  //                           <span className="text-gray-500">{c.phone}</span>
  //                           {newPhones.has(c.phone) && (
  //                             <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs animate-pulse">
  //                               Nuevo
  //                             </span>
  //                           )}
  //                         </div>
  //                       </Link>
  //                     </li>
  //                   ))}
  //                 </ul>
  //               )}
  //             </div>
  //           </div>
  //           <div className="rounded-lg border p-4">
  //             <div className="flex flex-row items-center justify-between space-y-0 pb-2">
  //               <div className="text-sm font-medium">
  //                 Active Users
  //               </div>
  //             </div>
  //             <div className="pt-4">
  //               <div className="text-2xl font-bold">0</div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // )
}
