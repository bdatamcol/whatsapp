// src/test-mongo.ts
import { connectToDatabase } from '@/lib/whatsapp/database/mongodb';

// Verificación de entorno servidor
if (typeof window !== 'undefined') {
  throw new Error('Este módulo solo puede usarse en el servidor');
}

(async () => {
  try {
    const { client, db } = await connectToDatabase();
    console.log('Conexión exitosa a la base de datos:', db.databaseName);
    
    // Verifica la conexión con un ping
    await db.command({ ping: 1 });
    console.log('Ping exitoso a MongoDB');
    
    // Cierra la conexión cuando termines
    await client.close();
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
})();