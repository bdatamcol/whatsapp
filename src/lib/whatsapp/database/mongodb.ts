// src/app/api/whatsapp/mongo/mongodb.ts
import { MongoClient, ServerApiVersion, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is not defined');

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10, // Límite de conexiones
  socketTimeoutMS: 30000,
  connectTimeoutMS: 5000
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Configuración para desarrollo y producción
if (process.env.NODE_ENV === 'development') {
  // En desarrollo, usa una conexión global para evitar múltiples instancias
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // En producción, crea una nueva conexión
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Obtiene una instancia del cliente MongoDB
 * @returns Promise<MongoClient>
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(uri, options);
    await client.connect();
  }
  return client;
}

/**
 * Conecta a la base de datos y devuelve tanto el cliente como la instancia de DB
 * @returns Promise<{ client: MongoClient; db: Db }>
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const client = await getMongoClient();
  const db = client.db(process.env.MONGODB_DB || 'whatsapp-business');
  return { client, db };
}

/**
 * Prueba la conexión con la base de datos
 * @returns Promise<boolean> - true si la conexión es exitosa
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB || 'whatsapp-business');
    await db.command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

// Exporta la promesa del cliente como valor por defecto
export default clientPromise;

// Tipado para el objeto global en desarrollo
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}