// ============================================================
// config/db.js — Pool de conexión MySQL con mysql2/promise
// ============================================================
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Timezone y charset para compatibilidad con phpMyAdmin
  timezone: '+00:00',
  charset: 'utf8mb4',
});

/**
 * Verifica la conexión a la base de datos al iniciar el servidor.
 * Lanza un error descriptivo si XAMPP/MySQL no está corriendo.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('  ✓ MySQL conectado → Base de datos:', process.env.DB_NAME);
    connection.release();
  } catch (error) {
    console.error('  ✗ Error de conexión a MySQL:', error.message);
    console.error('  → Verifica que XAMPP/MySQL esté corriendo en el puerto', process.env.DB_PORT);
    throw error;
  }
}

module.exports = { pool, testConnection };
