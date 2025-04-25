import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/utils/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID del mensaje.' }, { status: 400 });
    }

    const result = await db.collection('messages').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Mensaje no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Mensaje eliminado exitosamente.' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar el mensaje.' }, { status: 500 });
  }
}
