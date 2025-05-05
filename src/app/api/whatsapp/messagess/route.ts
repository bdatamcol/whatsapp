// app/api/messages/route.ts
import { NextApiRequest, NextApiResponse } from 'next';

// Store en memoria para los mensajes (simulación de base de datos)
let messagesStore: any[] = [];

// Función para agregar un mensaje al store
export const addMessageToStore = (message: any) => {
  messagesStore.push(message);
};

// Manejador para las solicitudes GET y POST
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Si es una solicitud POST, agregamos el mensaje al store
    const newMessage = req.body;
    console.log('Nuevo mensaje recibido:', newMessage); // Depuración
    addMessageToStore(newMessage);
    return res.status(200).json({ message: 'Mensaje recibido y guardado' });
  } else if (req.method === 'GET') {
    // Si es una solicitud GET, devolvemos los mensajes almacenados
    return res.status(200).json(messagesStore);
  } else {
    // Respuesta por defecto para otros métodos HTTP
    res.status(405).json({ message: 'Método no permitido' });
  }
}
