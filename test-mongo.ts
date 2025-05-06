// test-mongodb.ts
import { MongoClient } from 'mongodb';

async function testConnection() {
  console.log('🔍 Verificando conexión MongoDB...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI no está definido en .env');
  }

  console.log('🔌 URI de conexión:', uri.replace(/:\/\/.*@/, '://****:****@'));

  const client = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  });

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'whatsapp-business');
    await db.command({ ping: 1 });
    console.log('🟢 Ping exitoso a MongoDB');
    
    const collections = await db.listCollections().toArray();
    console.log('📚 Colecciones disponibles:', collections.map(c => c.name));
  } finally {
    await client.close();
  }
}

testConnection()
  .then(() => console.log('✅ Prueba completada con éxito'))
  .catch(err => {
    console.error('❌ Error en la prueba:');
    console.error(err);
    process.exit(1);
  });