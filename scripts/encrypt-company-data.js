// Script para cifrar datos sensibles de las empresas
// Ejecutar con: node scripts/encrypt-company-data.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Inicializar cliente Supabase con la clave de servicio
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY
);

// Función para cifrar datos
function encryptData(text, secretKey) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Función para verificar si un texto ya está cifrado
function isEncrypted(text) {
  if (!text) return false;
  // Verificar si tiene el formato de texto cifrado (iv:encrypted)
  const parts = text.split(':');
  return parts.length === 2 && parts[0].length === 32; // IV en hex tiene 32 caracteres
}

async function migrateData() {
  console.log('Iniciando migración de datos sensibles...');
  
  // Verificar clave de cifrado
  const secretKey = process.env.ENCRYPTION_KEY;
  if (!secretKey || secretKey.length !== 64) {
    console.error('Error: ENCRYPTION_KEY debe ser una cadena hexadecimal de 64 caracteres (32 bytes)');
    process.exit(1);
  }

  try {
    // 1. Obtener todas las empresas
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, prompt, whatsapp_access_token, phone_number_id, meta_app_id, waba_id, facebook_access_token, facebook_ad_account_id, marketing_account_id, facebook_catalog_id');

    if (error) {
      throw new Error(`Error al obtener empresas: ${error.message}`);
    }

    console.log(`Encontradas ${companies.length} empresas para procesar`);

    // 2. Procesar cada empresa
    let updatedCount = 0;
    for (const company of companies) {
      const updates = {};
      let needsUpdate = false;

      // Cifrar prompt si existe y no está cifrado
      if (company.prompt && !isEncrypted(company.prompt)) {
        updates.prompt = encryptData(company.prompt, secretKey);
        needsUpdate = true;
      }

      // Cifrar token de WhatsApp si existe y no está cifrado
      if (company.whatsapp_access_token && !isEncrypted(company.whatsapp_access_token)) {
        updates.whatsapp_access_token = encryptData(company.whatsapp_access_token, secretKey);
        needsUpdate = true;
      }
      
      // Cifrar phone_number_id si existe y no está cifrado
      if (company.phone_number_id && !isEncrypted(company.phone_number_id)) {
        updates.phone_number_id = encryptData(company.phone_number_id, secretKey);
        needsUpdate = true;
      }
      
      // Cifrar meta_app_id si existe y no está cifrado
      if (company.meta_app_id && !isEncrypted(company.meta_app_id)) {
        updates.meta_app_id = encryptData(company.meta_app_id, secretKey);
        needsUpdate = true;
      }
      
      // Cifrar waba_id si existe y no está cifrado
      if (company.waba_id && !isEncrypted(company.waba_id)) {
        updates.waba_id = encryptData(company.waba_id, secretKey);
        needsUpdate = true;
      }

      // facebook_access_token, facebook_ad_account_id, marketing_account_id, facebook_catalog_id
      if (company.facebook_access_token && !isEncrypted(company.facebook_access_token)) {
        updates.facebook_access_token = encryptData(company.facebook_access_token, secretKey);
        needsUpdate = true;
      }
      if (company.facebook_ad_account_id && !isEncrypted(company.facebook_ad_account_id)) {
        updates.facebook_ad_account_id = encryptData(company.facebook_ad_account_id, secretKey);
        needsUpdate = true;
      }
      if (company.marketing_account_id && !isEncrypted(company.marketing_account_id)) {
        updates.marketing_account_id = encryptData(company.marketing_account_id, secretKey);
        needsUpdate = true;
      }
      if (company.facebook_catalog_id && !isEncrypted(company.facebook_catalog_id)) {
        updates.facebook_catalog_id = encryptData(company.facebook_catalog_id, secretKey);
        needsUpdate = true;
      }

      // Actualizar la empresa si hay cambios
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('companies')
          .update(updates)
          .eq('id', company.id);

        if (updateError) {
          console.error(`Error al actualizar empresa ${company.id}: ${updateError.message}`);
        } else {
          updatedCount++;
          console.log(`Empresa ${company.id} actualizada correctamente`);
        }
      }
    }

    console.log(`Migración completada. ${updatedCount} empresas actualizadas.`);
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  }
}

migrateData();