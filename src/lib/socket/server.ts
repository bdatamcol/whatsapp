// lib/socket/server.ts
import { Server } from 'socket.io';
import { createServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';

// Configuración para Next.js API routes
export const config = {
  api: {
    bodyParser: false,
  },
};

// Crea el servidor HTTP
const httpServer = createServer();

// Configura Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://www.bdatamcrm.com/' 
      : 'http://localhost:3000',
    methods: ['GET', 'POST']
  },
  path: '/api/socket.io'
});

// Manejo de conexiones
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Inicia el servidor
const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

export default io;