'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Pencil, Loader2, Check, X, Search, MapPin, Activity, User } from 'lucide-react';
import { toast } from 'sonner';
import Input from './ui/Input';
import { number } from 'framer-motion';

interface Contact {
  name: string;
  phone: string;
  avatar_url: string;
  tags: [] | null;
  status: string;
  needs_human: boolean;
  cities: Cities;
}

interface Cities {
  name: string;
}

export default function ContactList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [filters, setFilters] = useState({
    phone: '',
    city: '',
    regionId: '',
    status: '',
    human: ''
  });

  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    fetch('/api/whatsapp/regions')
      .then(res => res.json())
      .then(setRegions)
  }, [])

  useEffect(() => {
    if (!filters.regionId) return;
    fetch(`/api/whatsapp/cities?region_id=${filters.regionId}`)
      .then(res => res.json())
      .then(setCities)
  }, [filters.regionId])

  useEffect(() => {
    // Para evitar que dispare cuando solo cambia regionId (que no aplica el filtro)
    if (filters.regionId === '') return;
    fetchContacts();
  }, [filters.city, filters.status, filters.human, filters.phone]);

  useEffect(() => {
    if (!filters.phone) {
      fetchContacts();
      return;
    }
    const timeout = setTimeout(() => {
      fetchContacts();
    }, 300); // Espera 300ms después de que el usuario deje de escribir
    return () => clearTimeout(timeout); // Limpia si el usuario sigue escribiendo
  }, [filters.phone]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/whatsapp/contacts?${params.toString()}`);
      if (!response.ok) throw new Error('Error al cargar los contactos');
      const data = await response.json();
      setContacts(data);
    } catch (err) {
      toast.error('Error al cargar los contactos', {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (contact: Contact) => {
    setEditingContact(contact.phone);
    setEditName(contact.name);
  };

  const cancelEditing = () => {
    setEditingContact(null);
    setEditName('');
  };

  const saveEdit = async (phone: string) => {
    try {
      const response = await fetch(`/api/whatsapp/contacts/${phone}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: editName }),
      });

      if (!response.ok) throw new Error('Error al actualizar el contacto');

      // Actualizar la lista local
      setContacts(contacts.map(contact =>
        contact.phone === phone ? { ...contact, name: editName } : contact
      ));
      setEditingContact(null);
      setEditName('');

      toast.success('Contacto actualizado correctamente');
    } catch (err) {
      toast.error('Error al actualizar el contacto', {
        description: err.message,
        closeButton: true
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Contactos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por teléfono"
                className="pl-9"
                value={filters.phone}
                onChange={(e) => setFilters(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.regionId || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  regionId: e.target.value,
                  city: '' // resetea ciudad cuando se cambia de departamento
                }))}
              >
                <option value="">Todos los departamentos</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              >
                <option value="">Todas las ciudades</option>
                {cities?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="relative">
              <Activity className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">Todos los estados</option>
                <option value="new">Nuevo</option>
                <option value="in_progress">En Proceso</option>
                <option value="waiting_human">Esperando Humano</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>

            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filters.human}
                onChange={(e) => setFilters(prev => ({ ...prev, human: e.target.value }))}
              >
                <option value="">¿Requiere humano?</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="relative">
              <button
                onClick={() => setFilters({
                  phone: '',
                  city: '',
                  regionId: '',
                  status: '',
                  human: ''
                })}
                className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Teléfono</th>
                  <th className="px-6 py-3">Ciudad</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Etiquetas</th>
                  <th className="px-6 py-3">Requiere Humano</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.phone} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {editingContact === contact.phone ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          />
                          <button
                            onClick={() => saveEdit(contact.phone)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {contact.name}
                          <button
                            onClick={() => startEditing(contact)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{contact.phone}</td>
                    <td className="px-6 py-4">{contact.cities.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${contact.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags?.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${contact.needs_human
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                        }`}>
                        {contact.needs_human ? 'Sí' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}