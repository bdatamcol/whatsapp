import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/utils/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { id, message } = await request.json();

    if (!id || !message) {
      return NextResponse.json({ error: 'Faltan datos requeridos.' }, { status: 400 });
    }

    const result = await db.collection('messages').updateOne(
      { _id: new ObjectId(id) },
      { $set: { message } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Mensaje no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Mensaje actualizado exitosamente.' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar el mensaje.' }, { status: 500 });
  }
}
