// Script para crear el bucket de almacenamiento de Supabase
// Ejecutar con: node scripts/setup-storage.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Validar variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Se requieren las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_ROLE_KEY');
  process.exit(1);
}

// Crear cliente de Supabase con la clave de servicio
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  try {
    // Crear el bucket 'public' si no existe
    const { data: existingBucket, error: checkError } = await supabase
      .storage
      .getBucket('public');

    if (existingBucket) {
      console.log('✅ El bucket "public" ya existe');
      return;
    }

    // Crear el bucket con configuración adecuada
    const { data: bucket, error: createError } = await supabase
      .storage
      .createBucket('public', {
        public: true, // Hacer el bucket público para acceso directo
        fileSizeLimit: 5242880, // 5MB límite por archivo
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg']
      });

    if (createError) {
      console.error('❌ Error al crear el bucket:', createError.message);
      process.exit(1);
    }

    console.log('✅ Bucket "public" creado exitosamente');
    console.log('📁 Configuración del bucket:');
    console.log('   - Nombre: public');
    console.log('   - Acceso: público');
    console.log('   - Límite de archivo: 5MB');
    console.log('   - Tipos permitidos: JPG, JPEG, PNG');

    // Crear la carpeta base para las imágenes de WhatsApp
    const { error: uploadError } = await supabase
      .storage
      .from('public')
      .upload('whatsapp-images/.gitkeep', Buffer.from(''), {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError && !uploadError.message.includes('duplicate')) {
      console.warn('⚠️ Advertencia al crear carpeta base:', uploadError.message);
    } else {
      console.log('✅ Estructura de carpetas inicializada');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    process.exit(1);
  }
}

// Ejecutar la función principal
setupStorage();