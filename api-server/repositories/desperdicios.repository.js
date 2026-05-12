const { pool } = require('../config/db');

class DesperdiciosRepository {
  async create(data) {
    const { maquina_id, cantidad_kg, cantidad_ml, comentario, fecha, trabajo_id } = data;
    const [result] = await pool.execute(
      'INSERT INTO desperdicios (maquina_id, trabajo_id, cantidad_kg, cantidad_ml, comentario, fecha) VALUES (?, ?, ?, ?, ?, ?)',
      [maquina_id, trabajo_id || null, cantidad_kg, cantidad_ml, comentario || null, fecha || new Date()]
    );
    return { id: result.insertId, ...data };
  }

  async findAllByEmpresa(empresa_id) {
    const [rows] = await pool.execute(`
      SELECT 
        d.*, 
        m.nombre as maquina_nombre 
      FROM desperdicios d
      JOIN maquinas m ON d.maquina_id = m.id
      WHERE m.empresa_id = ?
      ORDER BY d.fecha DESC
    `, [empresa_id]);
    return rows;
  }
}

module.exports = new DesperdiciosRepository();
