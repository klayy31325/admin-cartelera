const { pool } = require('../config/db');

async function migrate() {
  try {
    console.log('Iniciando migración de tabla tvs...');
    
    // 1. Agregar columna uid si no existe
    const [columns] = await pool.execute('SHOW COLUMNS FROM tvs LIKE "uid"');
    if (columns.length === 0) {
      await pool.execute('ALTER TABLE tvs ADD COLUMN uid VARCHAR(100) UNIQUE AFTER id');
      console.log('✓ Columna "uid" agregada a la tabla tvs.');
    } else {
      console.log('- La columna "uid" ya existe.');
    }

    // 2. Opcional: Asegurar que el estado_conexion tenga los valores correctos
    console.log('Migración completada con éxito.');
    process.exit(0);
  } catch (error) {
    console.error('Error en la migración:', error.message);
    process.exit(1);
  }
}

migrate();
