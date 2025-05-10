import { connectToDatabase } from '@/lib/whatsapp/database/mongodb';

// En cualquier archivo que use MongoDB directamente
if (typeof window !== 'undefined') {
  throw new Error('Este módulo solo puede usarse en el servidor');
}

(async () => {
  try {
    const { db } = await connectToDatabase();
    console.log('Conexión exitosa a la base de datos:', db.databaseName);
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
})();
