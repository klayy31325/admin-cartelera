const { pool } = require('../config/db');

async function migrate() {
  try {
    console.log('Actualizando tabla tvs para gestión avanzada...');
    
    // 1. Agregar columna maquina_id para vincular TV a una máquina específica
    const [columns] = await pool.execute('SHOW COLUMNS FROM tvs LIKE "maquina_id"');
    if (columns.length === 0) {
      await pool.execute('ALTER TABLE tvs ADD COLUMN maquina_id INT NULL AFTER departamento_id');
      await pool.execute('ALTER TABLE tvs ADD CONSTRAINT fk_tv_maquina FOREIGN KEY (maquina_id) REFERENCES maquinas(id)');
      console.log('✓ Columna "maquina_id" agregada y vinculada a la tabla maquinas.');
    } else {
      console.log('- La columna "maquina_id" ya existe.');
    }

    console.log('Migración completada.');
    process.exit(0);
  } catch (error) {
    console.error('Error en la migración:', error.message);
    process.exit(1);
  }
}

migrate();
