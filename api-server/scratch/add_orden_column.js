const { pool } = require('../config/db');

async function run() {
  try {
    console.log('Ejecutando migración: ALTER TABLE produccion_informativa ADD COLUMN orden INT NOT NULL DEFAULT 0;');
    await pool.execute('ALTER TABLE produccion_informativa ADD COLUMN orden INT NOT NULL DEFAULT 0;');
    console.log('¡Columna "orden" agregada correctamente!');
  } catch (err) {
    console.error('Error al ejecutar la migración:', err.message);
  } finally {
    process.exit(0);
  }
}

run();
