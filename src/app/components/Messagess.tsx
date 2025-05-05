// app/messagess.tsx o donde tengas el componente
'use client';

import { useEffect, useState } from 'react';

interface WhatsAppMessage {
  id: string;
  from: string;
  text: string;
  type: string;
  timestamp: string;
  status?: string;
}

export default function Messagess() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/messages');
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else {
          console.error('Error al cargar mensajes:', res.statusText);
        }
      } catch (err) {
        console.error('Error al conectar con el servidor:', err);
      }
    };

    fetchMessages();

    // Opcional: recargar cada 10 segundos (polling)
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Mensajes Recibidos</h1>
      {messages.length === 0 ? (
        <p>No hay mensajes aún.</p>
      ) : (
        <ul className="space-y-4">
          {messages.map((msg) => (
            <li key={msg.id} className="p-4 border rounded shadow-sm bg-white">
              <p><strong>De:</strong> {msg.from}</p>
              <p><strong>Mensaje:</strong> {msg.text}</p>
              <p><strong>Tipo:</strong> {msg.type}</p>
              {msg.status && <p><strong>Estado:</strong> {msg.status}</p>}
              <p className="text-gray-500 text-sm">{new Date(parseInt(msg.timestamp) * 1000).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

//