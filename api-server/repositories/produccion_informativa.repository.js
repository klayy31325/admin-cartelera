const { pool } = require('../config/db');

class ProduccionInformativaRepository {
  async findAll(empresa_id) {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.execute(
      `SELECT pi.*, m.nombre as maquina_nombre 
       FROM produccion_informativa pi
       LEFT JOIN maquinas m ON pi.maquina_id = m.id
       WHERE pi.empresa_id = ? AND pi.fecha_asignada = ?
       ORDER BY pi.prioridad DESC`,
      [empresa_id, today]
    );
    return rows;
  }

  async findByMaquina(maquina_id, empresa_id) {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.execute(
      `SELECT pi.*, m.nombre as maquina_nombre 
       FROM produccion_informativa pi
       LEFT JOIN maquinas m ON pi.maquina_id = m.id
       WHERE pi.maquina_id = ? AND pi.empresa_id = ? AND pi.fecha_asignada = ?
       ORDER BY pi.prioridad DESC`,
      [maquina_id, empresa_id, today]
    );
    return rows;
  }

  async findById(id) {
    const [[row]] = await pool.execute('SELECT * FROM produccion_informativa WHERE id = ?', [id]);
    return row;
  }

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO produccion_informativa 
       (empresa_id, maquina_id, tarea, meta_valor, descripcion_secundaria, prioridad, estado, fecha_asignada) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.empresa_id || 2,
        data.maquina_id,
        data.tarea || '',
        data.meta_valor !== undefined ? data.meta_valor : null,
        data.descripcion_secundaria || null,
        data.prioridad || 'media',
        data.estado || 'pendiente',
        data.fecha_asignada || new Date().toISOString().split('T')[0]
      ]
    );
    return { id: result.insertId, ...data };
  }

  async update(id, data) {
    const current = await this.findById(id);
    if (!current) throw new Error('Registro no encontrado');

    await pool.execute(
      `UPDATE produccion_informativa 
       SET maquina_id = ?, tarea = ?, meta_valor = ?, descripcion_secundaria = ?, prioridad = ?, estado = ?, fecha_asignada = ? 
       WHERE id = ?`,
      [
        data.maquina_id !== undefined ? data.maquina_id : current.maquina_id,
        data.tarea !== undefined ? data.tarea : current.tarea,
        data.meta_valor !== undefined ? data.meta_valor : current.meta_valor,
        data.descripcion_secundaria !== undefined ? data.descripcion_secundaria : current.descripcion_secundaria,
        data.prioridad !== undefined ? data.prioridad : current.prioridad,
        data.estado !== undefined ? data.estado : current.estado,
        data.fecha_asignada !== undefined ? data.fecha_asignada : current.fecha_asignada,
        id
      ]
    );
    return { id, ...data };
  }

  async delete(id) {
    const [result] = await pool.execute('DELETE FROM produccion_informativa WHERE id = ?', [id]);
    return result;
  }
}

module.exports = new ProduccionInformativaRepository();
