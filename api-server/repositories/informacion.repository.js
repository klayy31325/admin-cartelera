const { pool } = require('../config/db');

class InformacionRepository {
  async findAll(empresa_id) {
    const [rows] = await pool.execute(
      'SELECT * FROM informacion_diaria WHERE empresa_id = ? ORDER BY activo DESC, prioridad DESC, fecha_publicacion DESC',
      [empresa_id]
    );
    return rows;
  }

  async findAllActive(empresa_id) {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.execute(
      `SELECT * FROM informacion_diaria 
       WHERE empresa_id = ? AND activo = 1 
       AND fecha_publicacion <= ? 
       AND (fecha_expiracion IS NULL OR fecha_expiracion >= ?) 
       ORDER BY prioridad DESC, fecha_publicacion DESC`,
      [empresa_id, today, today]
    );
    return rows;
  }

  async findById(id) {
    const [[row]] = await pool.execute('SELECT * FROM informacion_diaria WHERE id = ?', [id]);
    return row;
  }

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO informacion_diaria 
       (empresa_id, titulo, contenido, prioridad, fecha_publicacion, fecha_expiracion, activo) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.empresa_id || 2,
        data.titulo || '',
        data.contenido || '',
        data.prioridad || 'baja',
        data.fecha_publicacion || new Date().toISOString().split('T')[0],
        data.fecha_expiracion || null,
        data.activo !== undefined ? (data.activo ? 1 : 0) : 1
      ]
    );
    return { id: result.insertId, ...data };
  }

  async update(id, data) {
    const current = await this.findById(id);
    if (!current) throw new Error('Información no encontrada');

    await pool.execute(
      `UPDATE informacion_diaria 
       SET titulo = ?, contenido = ?, prioridad = ?, fecha_publicacion = ?, fecha_expiracion = ?, activo = ? 
       WHERE id = ?`,
      [
        data.titulo !== undefined ? data.titulo : current.titulo,
        data.contenido !== undefined ? data.contenido : current.contenido,
        data.prioridad !== undefined ? data.prioridad : current.prioridad,
        data.fecha_publicacion !== undefined ? data.fecha_publicacion : current.fecha_publicacion,
        data.fecha_expiracion !== undefined ? data.fecha_expiracion : current.fecha_expiracion,
        data.activo !== undefined ? (data.activo ? 1 : 0) : current.activo,
        id
      ]
    );
    return { id, ...data };
  }

  async delete(id) {
    const [result] = await pool.execute('DELETE FROM informacion_diaria WHERE id = ?', [id]);
    return result;
  }
}

module.exports = new InformacionRepository();
