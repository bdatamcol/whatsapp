//dashboard para el asistente
'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client.supabase';
import { getCurrentUserClient } from '@/lib/auth/services/getUserFromRequest';
import { toast } from 'sonner';
import Link from 'next/link';
import Card from '@/app/components/ui/card';

type Contact = {
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
        .from('assigned_contacts_view')
        .select('phone, name')
        .eq('assigned_to', user.id)
        .eq('company_id', user.company_id);

      if (!error && existing) {
        setContacts(existing);
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
}
