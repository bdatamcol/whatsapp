import { supabase } from '@/lib/supabase/server.supabase';
import crypto from 'crypto';

// Función para descifrar datos
function decryptData(encryptedText: string, secretKey: string): string {
    try {
        // Verificar si el texto tiene el formato esperado para datos cifrados
        if (!encryptedText || typeof encryptedText !== 'string') {
            return encryptedText;
        }
        
        // Verificar si tiene el formato de texto cifrado (iv:encrypted)
        const parts = encryptedText.split(':');
        if (parts.length !== 2) {
            return encryptedText;
        }
        
        const [ivHex, encryptedHex] = parts;
        
        // Verificar que ambas partes sean hexadecimales válidas
        if (!ivHex || !encryptedHex) {
            console.warn('[Prompt] Formato de texto cifrado inválido, falta IV o datos cifrados');
            return encryptedText;
        }
        
        // Verificar formato hexadecimal
        if (!/^[0-9a-fA-F]+$/.test(ivHex)) {
            console.warn('[Prompt] Formato de IV inválido, no es hexadecimal');
            return encryptedText;
        }
        
        if (!/^[0-9a-fA-F]+$/.test(encryptedHex)) {
            console.warn('[Prompt] Formato de datos cifrados inválido, no es hexadecimal');
            return encryptedText;
        }
        
        // Verificar que la clave sea hexadecimal válida y de longitud correcta (32 bytes = 64 caracteres hex)
        if (!secretKey) {
            console.warn('[Prompt] Clave de cifrado no proporcionada');
            return encryptedText;
        }
        
        if (secretKey.length !== 64) {
            console.warn('[Prompt] Longitud de clave de cifrado incorrecta, debe ser de 64 caracteres');
            return encryptedText;
        }
        
        if (!/^[0-9a-fA-F]+$/.test(secretKey)) {
            console.warn('[Prompt] Formato de clave de cifrado inválido, no es hexadecimal');
            return encryptedText;
        }
        
        try {
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
            let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (cryptoError) {
            // Error específico de descifrado
            console.error('[Prompt] Error en la operación de descifrado:', cryptoError);
            return encryptedText;
        }
    } catch (error) {
        // Si hay error al descifrar, devolver el texto original
        console.error('[Prompt] Error al descifrar prompt, usando versión sin descifrar:', error);
        return encryptedText;
    }
}

export async function getPromptByEmpresaId(companyId: string): Promise<string> {
    const { data, error } = await supabase
        .from('companies')
        .select('prompt')
        .eq('id', companyId)
        .maybeSingle();

    if (error || !data?.prompt) {
        console.warn('[Prompt] No se encontró prompt personalizado para la empresa. Usando uno por defecto.');
        return 'Eres un asistente virtual amigable y profesional. Responde de forma clara y concisa.';
    }

    // Intentar descifrar el prompt
    const secretKey = process.env.ENCRYPTION_KEY;
    if (secretKey && data.prompt.includes(':')) {
        return decryptData(data.prompt, secretKey);
    }
    
    // Si no hay clave de cifrado o el prompt no parece estar cifrado, devolver tal cual
    return data.prompt;
}
