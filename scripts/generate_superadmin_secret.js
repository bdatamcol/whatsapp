// Script para generar un valor seguro para SUPERADMIN_CREATION_SECRET
const crypto = require('crypto');

// Generar un valor hexadecimal aleatorio de 40 caracteres (similar al SEED_SECRET)
const superadminSecret = crypto.randomBytes(20).toString('hex');

console.log('Valor generado para SUPERADMIN_CREATION_SECRET:');
console.log(superadminSecret);
console.log('\nAgrega este valor a tu archivo .env.local:');
console.log('SUPERADMIN_CREATION_SECRET=' + superadminSecret);