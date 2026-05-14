const { pool } = require('./config/db');

async function check() {
  const [rows] = await pool.execute(`
    SELECT mp.nombre, SUM(pt.minutos) as total 
    FROM paradas_trabajo pt 
    JOIN trabajos t ON pt.trabajo_id = t.id 
    JOIN motivos_parada mp ON pt.motivo_id = mp.id 
    WHERE t.maquina_id = 1 AND t.fecha LIKE '2026-05%'
    GROUP BY mp.nombre
  `);
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
check();
