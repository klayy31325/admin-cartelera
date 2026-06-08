require('dotenv').config({path:'api-server/.env'});
const mysql = require('mysql2/promise');
(async () => {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306
  });
  await pool.execute("INSERT IGNORE INTO roles (id, nombre) VALUES (4, 'editor')");
  const [r] = await pool.execute("SELECT * FROM roles ORDER BY id");
  r.forEach(x => console.log(x.id, x.nombre));
  process.exit(0);
})();
