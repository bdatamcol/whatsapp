import { supabase } from "@/lib/supabase/server.supabase";
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
        if (!ivHex || !encryptedHex || !/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(encryptedHex)) {
            return encryptedText;
        }
        
        // Verificar que la clave sea hexadecimal válida y de longitud correcta (32 bytes = 64 caracteres hex)
        if (!secretKey || secretKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(secretKey)) {
            console.warn('[getCompanyByPhoneNumberId] Clave de cifrado inválida o con formato incorrecto');
            return encryptedText;
        }
        
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        // Si hay error al descifrar, devolver el texto original
        console.warn('[getCompanyByPhoneNumberId] Error al descifrar datos, usando versión sin descifrar:', error);
        return encryptedText;
    }
}

export async function getCompanyByPhoneNumberId(phoneNumberId: string) {
    
    // Primero intentamos buscar directamente (para compatibilidad con datos no cifrados)
    let { data: company, error } = await supabase
        .from('companies')
        .select('id, whatsapp_access_token, whatsapp_number, phone_number_id, meta_app_id, waba_id')
        .eq('phone_number_id', phoneNumberId)
        .eq('is_active', true)
        .maybeSingle();
    
    // Si no encontramos la compañía directamente, puede ser porque el phone_number_id está cifrado
    // En ese caso, obtenemos todas las compañías y buscamos manualmente después de descifrar
    if (!company) {
        const secretKey = process.env.ENCRYPTION_KEY || '';
        
        if (secretKey) {
            const { data: allCompanies, error: allError } = await supabase
                .from('companies')
                .select('id, whatsapp_access_token, whatsapp_number, phone_number_id, meta_app_id, waba_id')
                .eq('is_active', true);
            
            if (allError) {
                console.error('[getCompanyByPhoneNumberId] Error al obtener todas las compañías:', allError);
            } else if (allCompanies && allCompanies.length > 0) {
                // Buscar la compañía que coincida después de descifrar
                for (const comp of allCompanies) {
                    if (comp.phone_number_id && comp.phone_number_id.includes(':')) {
                        const decryptedPhoneNumberId = decryptData(comp.phone_number_id, secretKey);
                        if (decryptedPhoneNumberId === phoneNumberId) {
                            company = comp;
                            break;
                        }
                    }
                }
            }
        }
    }
    
    if (error) console.error('[getCompanyByPhoneNumberId] Error:', error);
    if (!company) {
        console.warn('[getCompanyByPhoneNumberId] No se encontró la compañía con ese phone_number_id');
        throw new Error('Compañía no encontrada');
    }

    // Descifrar todos los campos cifrados
    const secretKey = process.env.ENCRYPTION_KEY || '';
    if (secretKey) {
        // Descifrar el token de WhatsApp si está cifrado
        if (company.whatsapp_access_token && company.whatsapp_access_token.includes(':')) {
            company.whatsapp_access_token = decryptData(company.whatsapp_access_token, secretKey);
        }
        
        // Descifrar phone_number_id si está cifrado
        if (company.phone_number_id && company.phone_number_id.includes(':')) {
            company.phone_number_id = decryptData(company.phone_number_id, secretKey);
        }
        
        // Descifrar meta_app_id si está cifrado
        if (company.meta_app_id && company.meta_app_id.includes(':')) {
            company.meta_app_id = decryptData(company.meta_app_id, secretKey);
        }
        
        // Descifrar waba_id si está cifrado
        if (company.waba_id && company.waba_id.includes(':')) {
            company.waba_id = decryptData(company.waba_id, secretKey);
        }
    }

    return company;
}
