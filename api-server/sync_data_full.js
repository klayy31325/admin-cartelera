const { pool } = require('./config/db');

async function syncAll() {
  try {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7); // "2026-05"
    const todayFull = today.toISOString().split('T')[0]; // "2026-05-13"

    console.log(`--- Sincronizando datos para ${todayFull} ---`);

    // 1. Actualizar Trabajos de Novoflex (ID 2) a Mayo
    const [resTrabajos] = await pool.execute(`
      UPDATE trabajos 
      SET fecha = DATE_FORMAT(fecha, '${currentMonth}-%d') 
      WHERE maquina_id = 2 AND fecha LIKE '2026-04%'
    `);
    console.log(`Trabajos Novoflex actualizados: ${resTrabajos.affectedRows}`);

    // 2. Actualizar Velocidad (ID 1 y 2) a Hoy
    // Usamos el día 13 para que coincida con hoy exactamente y aparezca en los gráficos de tiempo real
    const [resVelocidad] = await pool.execute(`
      UPDATE velocidad 
      SET fecha = ? 
      WHERE fecha LIKE '2026-04%'
    `, [todayFull]);
    console.log(`Registros de Velocidad actualizados: ${resVelocidad.affectedRows}`);

    // 3. También actualizar la columna created_at de velocidad para que la hora sea coherente con hoy
    // (Opcional, pero ayuda a que el gráfico de series de tiempo no se vea vacío si filtra por created_at)
    const [resVelTime] = await pool.execute(`
      UPDATE velocidad 
      SET created_at = CONCAT(?, ' ', TIME(created_at))
      WHERE DATE(created_at) < ?
    `, [todayFull, todayFull]);
    console.log(`Horarios de Velocidad actualizados: ${resVelTime.affectedRows}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

syncAll();
