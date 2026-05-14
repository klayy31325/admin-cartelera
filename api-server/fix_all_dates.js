const mysql = require('mysql2/promise');

async function fixDates() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admin_cartelera'
  });

  console.log('--- ACTUALIZANDO FECHAS A MAYO 2026 ---');

  try {
    // Actualizar Trabajos
    const [resTrabajos] = await connection.execute(
      "UPDATE trabajos SET fecha = '2026-05-14' WHERE fecha LIKE '2026-04%'"
    );
    console.log(`- Trabajos actualizados: ${resTrabajos.affectedRows}`);

    // Actualizar Velocidad
    const [resVel] = await connection.execute(
      "UPDATE velocidad SET fecha = '2026-05-14' WHERE fecha LIKE '2026-04%'"
    );
    console.log(`- Registros de velocidad actualizados: ${resVel.affectedRows}`);

    // Actualizar Desperdicios
    const [resDesp] = await connection.execute(
      "UPDATE desperdicios SET fecha = '2026-05-14' WHERE fecha LIKE '2026-04%'"
    );
    console.log(`- Registros de desperdicio actualizados: ${resDesp.affectedRows}`);

    console.log('\n--- PROCESO COMPLETADO ---');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

fixDates();
