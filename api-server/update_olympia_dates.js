const { pool } = require('./config/db');

async function updateDates() {
  try {
    console.log('--- Actualizando fechas de Olympia (ID 1) ---');
    
    // Obtener la fecha actual en formato YYYY-MM
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7); // "2026-05"
    
    // Actualizar los registros de Abril a Mayo para la máquina 1
    const [result] = await pool.execute(`
      UPDATE trabajos 
      SET fecha = DATE_FORMAT(fecha, '${currentMonth}-%d') 
      WHERE maquina_id = 1 AND fecha LIKE '2026-04%'
    `);

    console.log(`✓ Se actualizaron ${result.affectedRows} registros de producción.`);

    // También actualizar las fechas de paradas si el sistema lo requiere
    // (En este caso, las paradas cuelgan del trabajo_id, así que con mover el trabajo basta)

    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

updateDates();
