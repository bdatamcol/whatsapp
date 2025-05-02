import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/utils/mongodb';
import { errorHandler } from '@/app/middlewares/errorHandler';
import { logger } from '@/app/utils/logger';
import { validateMessageData } from '@/app/utils/validator';

export const POST = errorHandler(async (request: Request) => {
  logger.info('Solicitud recibida para enviar mensaje.');
  const { db } = await connectToDatabase();

  const data = await request.json();
  validateMessageData(data);

  const result = await db.collection('messages').insertOne(data);

  logger.info('Mensaje guardado exitosamente.');
  return NextResponse.json({ message: 'Mensaje guardado exitosamente.', id: result.insertedId });
});