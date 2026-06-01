const { pool } = require('./config/db');

async function test() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows1] = await pool.execute('SELECT COUNT(*) as count FROM trabajos WHERE fecha = ?', [today]);
    const [rows2] = await pool.execute('SELECT COUNT(*) as count FROM desperdicios WHERE fecha = ?', [today]);
    console.log("Count in trabajos for", today, ":", rows1[0].count);
    console.log("Count in desperdicios for", today, ":", rows2[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

test();
