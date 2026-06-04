const mysql = require('mysql2/promise');
require('dotenv').config();

async function findDuplicates() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306,
    timezone: '+00:00',
    charset: 'utf8mb4',
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 ANÁLISIS DE DUPLICADOS EN BASE DE DATOS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const [maquina, mid] of Object.entries({ OLYMPIA: 1, NOVOFLEX: 2 })) {
    console.log(`\n━━━ ${maquina} (id=${mid}) ━━━`);

    // 1. Total records
    const [[{ count }]] = await pool.execute(
      'SELECT COUNT(*) AS count FROM trabajos WHERE maquina_id = ?', [mid]
    );
    console.log(`Total trabajos: ${count}`);

    // 2. Buscar duplicados exactos por (numero_pedido, maquina_id, fecha)
    const [dups] = await pool.execute(
      `SELECT numero_pedido, fecha, COUNT(*) AS cnt
       FROM trabajos
       WHERE maquina_id = ?
       GROUP BY numero_pedido, fecha
       HAVING cnt > 1
       ORDER BY cnt DESC`,
      [mid]
    );
    if (dups.length > 0) {
      console.log(`\n⚠️  DUPLICADOS EXACTOS (mismo pedido+máquina+fecha): ${dups.length} grupos`);
      let totalDuplicados = 0;
      for (const d of dups) {
        totalDuplicados += d.cnt - 1;
        console.log(`   Pedido:${d.numero_pedido} Fecha:${d.fecha} → ${d.cnt} veces`);
        // Show the IDs
        const [rows] = await pool.execute(
          `SELECT id, fecha, created_at, metros_producidos, tiempo_produccion_min
           FROM trabajos
           WHERE maquina_id = ? AND numero_pedido = ? AND fecha = ?
           ORDER BY id`,
          [mid, d.numero_pedido, d.fecha]
        );
        for (const r of rows) {
          console.log(`     └ id=${r.id} fecha=${r.fecha} created=${r.created_at} metros=${r.metros_producidos} t.prod=${r.tiempo_produccion_min}`);
        }
      }
      console.log(`Total registros duplicados (excluyendo 1er original): ${totalDuplicados}`);
    } else {
      console.log('✅ No hay duplicados exactos por (pedido, máquina, fecha)');
    }

    // 3. Rango de fechas
    const [[{ min_fecha, max_fecha }]] = await pool.execute(
      'SELECT MIN(fecha) AS min_fecha, MAX(fecha) AS max_fecha FROM trabajos WHERE maquina_id = ?', [mid]
    );
    console.log(`\nRango de fechas: ${min_fecha} → ${max_fecha}`);

    // 4. Distribución por fecha
    const [porFecha] = await pool.execute(
      `SELECT fecha, COUNT(*) AS cnt, SUM(metros_producidos) AS total_metros
       FROM trabajos
       WHERE maquina_id = ?
       GROUP BY fecha
       ORDER BY fecha`,
      [mid]
    );
    console.log('\nDistribución por fecha:');
    for (const f of porFecha) {
      const marca = f.cnt > 1 ? ' ⚠️' : '';
      console.log(`   ${f.fecha}: ${f.cnt} trabajo(s), ${parseFloat(f.total_metros).toFixed(0)} metros${marca}`);
    }
  }

  await pool.end();
}

findDuplicates().catch(console.error);
