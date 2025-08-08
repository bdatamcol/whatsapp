//dashboard para el asistente
'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client.supabase';
import { getCurrentUserClient } from '@/lib/auth/services/getUserFromRequest';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Card from '@/app/components/ui/card';

type Contact = {
  name: string;
  phone: string;
};

export default function AssistantDashboard() {
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [newPhones, setNewPhones] = useState<Set<string>>(new Set());

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const fetchContacts = async (userId: string, companyId: string) => {
      try {
        // Usar JOIN directo en lugar de la vista para mayor control
        const { data, error } = await supabase
          .from('assistants_assignments')
          .select(`
            contact_phone,
            contacts!inner(name, phone)
          `)
          .eq('assigned_to', userId)
          .eq('company_id', companyId)
          .eq('active', true)
          .order('assigned_at', { ascending: false });

        if (error) {
          console.error('Error fetching contacts:', error);
          return;
        }

        if (data) {
          const contactsData = data.map((item: any) => ({
            phone: item.contact_phone,
            name: item.contacts?.name || 'Contacto sin nombre'
          }));
          setContacts(contactsData);
        }
      } catch (error) {
        console.error('Error in fetchContacts:', error);
      }
    };
    const init = async () => {
      const user = await getCurrentUserClient();
      if (!user?.id) return;

      setUserId(user.id);

      // Cargar contactos inicialmente
      await fetchContacts(user.id, user.company_id);

      // Configurar real-time con canales separados para cada tipo de evento
      const assignmentsChannel = supabase
        .channel('realtime-assignments')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'assistants_assignments',
            filter: `assigned_to=eq.${user.id}`,
          },
          async (payload) => {
            console.log('Nueva asignación recibida:', payload.new);
            const newPhone = payload.new.contact_phone;

            toast.success(`📱 Nuevo contacto asignado: ${newPhone}`);

            // Obtener datos del contacto
            const { data: contact } = await supabase
              .from('contacts')
              .select('name, phone')
              .eq('phone', newPhone)
              .single();

            if (contact) {
              setContacts(prev => {
                // Evitar duplicados
                const exists = prev.some(c => c.phone === contact.phone);
                if (exists) return prev;
                return [...prev, contact];
              });

              setNewPhones(prev => new Set(prev).add(contact.phone));
              setTimeout(() => {
                setNewPhones(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(contact.phone);
                  return newSet;
                });
              }, 8000);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'assistants_assignments',
            filter: `assigned_to=eq.${user.id}`,
          },
          async (payload) => {
            console.log('Asignación actualizada:', payload.new);

            if (payload.new.active === false) {
              toast.info(`🔄 Contacto devuelto a IA: ${payload.new.contact_phone}`);

              // Remover el contacto de la lista
              setContacts(prev =>
                prev.filter(contact => contact.phone !== payload.new.contact_phone)
              );
            } else if (payload.new.active === true) {
              // Si se reactivó, refrescar toda la lista
              await fetchContacts(user.id, user.company_id);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'assistants_assignments',
            filter: `assigned_to=eq.${user.id}`,
          },
          async (payload) => {
            console.log('Asignación eliminada:', payload.old);

            toast.warning(`❌ Asignación removida: ${payload.old.contact_phone}`);

            // Remover el contacto de la lista
            setContacts(prev =>
              prev.filter(contact => contact.phone !== payload.old.contact_phone)
            );
          }
        )
        .subscribe();

      // También escuchar cambios en los contactos que podrían afectar las asignaciones
      const contactsChannel = supabase
        .channel('realtime-contacts-status')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'contacts',
          },
          async (payload) => {
            // Si el contacto cambia de estado, refrescar las asignaciones
            if (payload.new.needs_human !== payload.old.needs_human ||
              payload.new.status !== payload.old.status) {
              await fetchContacts(user.id, user.company_id);
            }
          }
        )
        .subscribe();

      // Guardar referencias para limpieza
      channel = assignmentsChannel;
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
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors animate-in fade-in duration-300"
              >
                <div>
                  <p className="font-medium">{c.name || 'Contacto sin nombre'}</p>
                  <p className="text-sm text-muted-foreground">{c.phone}</p>
                </div>
                {newPhones.has(c.phone) && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs animate-pulse">
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
