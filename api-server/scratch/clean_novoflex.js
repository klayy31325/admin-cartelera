const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306,
  });

  const conn = await pool.getConnection();
  try {
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
    const [vel] = await conn.execute('DELETE FROM velocidad WHERE maquina_id = 2');
    console.log(`velocidad: ${vel.affectedRows}`);
    const [desp] = await conn.execute('DELETE FROM desperdicios WHERE maquina_id = 2');
    console.log(`desperdicios: ${desp.affectedRows}`);
    const [pt] = await conn.execute('DELETE pt FROM paradas_trabajo pt JOIN trabajos t ON t.id = pt.trabajo_id WHERE t.maquina_id = 2');
    console.log(`paradas_trabajo: ${pt.affectedRows}`);
    const [t] = await conn.execute('DELETE FROM trabajos WHERE maquina_id = 2');
    console.log(`trabajos: ${t.affectedRows}`);
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('NOVOFLEX (maquina_id=2) limpiado.');
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch(console.error);
