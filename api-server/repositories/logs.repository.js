const { pool } = require('../config/db');

class LogsRepository {
  async findAll(limit = 10) {
    const [rows] = await pool.execute(
      `SELECT l.*, u.nombre, u.apellido 
       FROM logs_actividad l 
       LEFT JOIN usuarios u ON l.usuario_id = u.id 
       ORDER BY l.created_at DESC LIMIT ?`,
      [limit]
    );
    return rows;
  }

  async create({ usuario_id, accion, descripcion, tipo = 'info' }) {
    await pool.execute(
      `INSERT INTO logs_actividad (usuario_id, accion, descripcion, tipo) VALUES (?, ?, ?, ?)`,
      [usuario_id || null, accion, descripcion, tipo]
    );
  }
}

module.exports = new LogsRepository();
