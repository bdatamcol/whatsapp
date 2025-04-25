'use client';

import React, { useEffect, useState } from 'react';

interface Page {
  id: string;
  name: string;
  fan_count?: number;
  category?: string;
  access_token?: string;
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
        const res = await fetch('/api/marketing/account');
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
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Información de la Cuenta de Marketing</h2>

      {account ? (
        <div className="mb-6">
          <p><strong>ID:</strong> {account.id}</p>
          <p><strong>Nombre:</strong> {account.name}</p>
          {account.business_name && <p><strong>Empresa:</strong> {account.business_name}</p>}
          {account.created_time && <p><strong>Creada:</strong> {new Date(account.created_time).toLocaleDateString()}</p>}
          {account.status && <p><strong>Estado:</strong> {account.status}</p>}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No hay datos de cuenta disponibles.</p>
      )}

      <h3 className="text-lg font-semibold mb-2">Páginas Asociadas</h3>
      <ul className="space-y-4">
        {Array.isArray(pages) && pages.length > 0 ? (
          pages.map((page) => (
            <li key={page.id} className="p-4 border rounded-lg">
              <p><strong>Nombre:</strong> {page.name}</p>
              <p><strong>ID:</strong> {page.id}</p>
              {page.fan_count !== undefined && <p><strong>Seguidores:</strong> {page.fan_count.toLocaleString()}</p>}
              {page.category && <p><strong>Categoría:</strong> {page.category}</p>}
            </li>
          ))
        ) : (
          <p className="text-sm text-gray-500">No hay páginas disponibles.</p>
        )}
      </ul>
    </div>
  );
}
