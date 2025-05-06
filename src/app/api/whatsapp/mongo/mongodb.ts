import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is not defined');

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
};



let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(uri, options);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Exporta tanto clientPromise como getMongoClient para compatibilidad
export default clientPromise;

export async function getMongoClient() {
  if (!client) {
    client = new MongoClient(uri, options);
    await client.connect();
  }
  return client;
}

export async function testConnection() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || 'whatsapp-business');
    await db.command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}