export function validateMessageData(data: { message: any }): void {
  if (!data.message || typeof data.message !== 'string') {
    throw new Error('El campo "message" es requerido y debe ser un string.');
  }
}

export function validateId(id: unknown): void {
  if (!id || typeof id !== 'string') {
    throw new Error('El campo "id" es requerido y debe ser un string.');
  }
}
