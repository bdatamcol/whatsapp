'use client';

import React, { useEffect, useState } from 'react';
import { Globe, Users, Tags, Calendar } from 'lucide-react';
import Card from './ui/card';

interface Page {
  id: string;
  name: string;
  fan_count?: number;
  category?: string;
  access_token?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface Account {
  id: string;
  name: string;
  business_name?: string;
  created_time?: string;
  status?: string;
}

export default function AccountManager() {
  const [account, setAccount] = useState<Account | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/marketing/company/account');
        const data = await res.json();

        if (!res.ok) {
          console.error('Error:', data.error);
          setError(data.error || 'Error desconocido');
        } else {
          setAccount(data.account);
          setPages(data.pages);
        }
      } catch (err) {
        console.error('Error de red:', err);
        setError('Error de red');
      } finally {
        setLoading(false); // <--- Esto es clave
      }
    };

    fetchData();
  }, []);

  if (loading) return <p className="text-gray-500 text-sm">Cargando información de cuenta...</p>;
  if (error) return <p className="text-red-500 text-sm">Error: {error}</p>;

  return (
    <div className="space-y-6">
      {account && (
        <Card>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Información de la Cuenta</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Globe className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">ID de Cuenta</p>
                  <p className="font-medium">{account.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Tags className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium">{account.name}</p>
                </div>
              </div>
              {account.business_name && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-500">Empresa</p>
                    <p className="font-medium">{account.business_name}</p>
                  </div>
                </div>
              )}
              {account.created_time && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Creación</p>
                    <p className="font-medium">{new Date(account.created_time).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-6">Páginas Asociadas</h3>
          {Array.isArray(pages) && pages.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page) => (
                <div key={page.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-visible border border-gray-100 pt-6">
                  <div className="flex justify-center -mt-8">
                    <div className="w-14 h-14 rounded-full ring-4 ring-white shadow-lg overflow-hidden">
                      {page.picture?.data?.url ? (
                        <img 
                          src={page.picture.data.url} 
                          alt={`${page.name} avatar`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100">
                          <Users className="w-8 h-8 text-blue-600" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-lg mb-2 truncate">{page.name}</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      {page.fan_count !== undefined && (
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{page.fan_count.toLocaleString()} seguidores</span>
                        </div>
                      )}
                      {page.category && (
                        <div className="flex items-center space-x-2">
                          <Tags className="w-4 h-4" />
                          <span>{page.category}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay páginas disponibles</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}