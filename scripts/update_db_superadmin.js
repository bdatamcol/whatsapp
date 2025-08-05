// Script para ejecutar la modificación de la base de datos para agregar el rol de superadmin
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Se requieren las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Crear cliente de Supabase con la clave de servicio
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateDatabase() {
  try {
    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, '..', 'sql', 'add_superadmin_role.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');

    // Ejecutar la consulta SQL
    const { error } = await supabase.rpc('exec_sql', { query: sqlQuery });

    if (error) {
      throw error;
    }

    console.log('✅ Base de datos actualizada correctamente para soportar el rol de superadmin');
  } catch (error) {
    console.error('❌ Error al actualizar la base de datos:', error.message);
    process.exit(1);
  }
}

// Ejecutar la función principal
updateDatabase();