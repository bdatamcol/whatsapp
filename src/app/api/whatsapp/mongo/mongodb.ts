// src/lib/mongodb.ts
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI no está definido en .env.local');

// Configuración ultra-minimalista que SIEMPRE funciona
const options = {
  connectTimeoutMS: 5000,
  socketTimeoutMS: 30000
};

const client = new MongoClient(uri, options);
const clientPromise = client.connect();

export default clientPromise;