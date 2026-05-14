const { pool } = require('../config/db');

async function checkVelocidad() {
  try {
    const [rows] = await pool.execute('SELECT * FROM velocidad ORDER BY fecha DESC LIMIT 5');
    console.log('Ultimos registros de velocidad:', JSON.stringify(rows, null, 2));
    
    const [maquinas] = await pool.execute('SELECT id, nombre FROM maquinas');
    console.log('Maquinas en DB:', JSON.stringify(maquinas, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkVelocidad();
