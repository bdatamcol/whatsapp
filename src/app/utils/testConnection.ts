import { connectToDatabase } from '@/app/utils/mongodb';

(async () => {
  try {
    const { db } = await connectToDatabase();
    console.log('Conexión exitosa a la base de datos:', db.databaseName);
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
  }
})();
