const { pool } = require('../config/db');

async function check() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`Checking data for today: ${today}`);

  const [velocidad] = await pool.execute('SELECT * FROM velocidad WHERE fecha = ?', [today]);
  const [desperdicios] = await pool.execute('SELECT * FROM desperdicios WHERE fecha = ?', [today]);
  const [trabajos] = await pool.execute('SELECT * FROM trabajos WHERE fecha = ?', [today]);

  console.log('--- VELOCIDAD ---');
  console.log(JSON.stringify(velocidad, null, 2));
  
  console.log('--- DESPERDICIOS ---');
  console.log(JSON.stringify(desperdicios, null, 2));

  console.log('--- TRABAJOS ---');
  console.log(JSON.stringify(trabajos, null, 2));

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
