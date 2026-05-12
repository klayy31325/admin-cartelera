require('dotenv').config({ path: '../api-server/.env' });
const { pool } = require('../api-server/config/db');

async function test() {
  const today = new Date().toISOString().split('T')[0];
  const maquina_id = 1; // Ajusta según tu DB
  
  console.log('--- TEST RESUMEN HOY ---');
  const [rows] = await pool.execute(`
      SELECT 
        m.id as maquina_id,
        m.nombre as maquina_nombre,
        COALESCE(SUM(t.metros_producidos), 0) as total_metros
      FROM maquinas m
      LEFT JOIN trabajos t ON m.id = t.maquina_id AND t.fecha = ?
      WHERE m.id = ?
      GROUP BY m.id, m.nombre
  `, [today, maquina_id]);
  
  console.log('Resultado:', rows);
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
