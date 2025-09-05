import crypto from 'crypto';

export function decryptData(encryptedText: string, secretKey?: string): string {
  try {
    if (!encryptedText || typeof encryptedText !== 'string') {
      return encryptedText;
    }

    // Formato esperado de datos cifrados: ivHex:encryptedHex
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      return encryptedText;
    }

    const [ivHex, encryptedHex] = parts;

    const isHex = (v: string) => /^[0-9a-fA-F]+$/.test(v);
    if (!ivHex || !encryptedHex || !isHex(ivHex) || !isHex(encryptedHex)) {
      return encryptedText;
    }

    // Clave: 32 bytes = 64 caracteres hexadecimales
    if (!secretKey || secretKey.length !== 64 || !isHex(secretKey)) {
      console.warn('[crypto] ENCRYPTION_KEY inválida o no provista; devolviendo texto original');
      return encryptedText;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.warn('[crypto] Error al descifrar; devolviendo texto original:', error);
    return encryptedText;
  }
}