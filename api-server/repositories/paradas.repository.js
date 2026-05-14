// ============================================================
// repositories/paradas.repository.js — Gestión de paradas por trabajo
// ============================================================
const { pool } = require('../config/db');

class ParadasRepository {
  /**
   * Obtiene el catálogo de motivos de parada
   */
  async getMotivos() {
    const [rows] = await pool.execute('SELECT * FROM motivos_parada ORDER BY nombre ASC');
    return rows;
  }

  /**
   * Registra o actualiza los minutos de parada para un trabajo específico
   */
  async upsertParadaTrabajo(conn, trabajo_id, motivo_id, minutos) {
    // Usamos ON DUPLICATE KEY UPDATE porque el SQL tiene un UNIQUE KEY (trabajo_id, motivo_id)
    const sql = `
      INSERT INTO paradas_trabajo (trabajo_id, motivo_id, minutos)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE minutos = VALUES(minutos)
    `;
    await conn.execute(sql, [trabajo_id, motivo_id, minutos]);
  }

  /**
   * Obtiene todas las paradas vinculadas a un trabajo
   */
  async findByTrabajo(trabajo_id) {
    const [rows] = await pool.execute(`
      SELECT 
        pt.*, 
        mp.nombre AS motivo_nombre, 
        mp.tipo AS motivo_tipo
      FROM paradas_trabajo pt
      JOIN motivos_parada mp ON pt.motivo_id = mp.id
      WHERE pt.trabajo_id = ?
    `, [trabajo_id]);
    return rows;
  }

  /**
   * Borra todas las paradas de un trabajo (útil para re-grabado manual)
   */
  async deleteByTrabajo(conn, trabajo_id) {
    await conn.execute('DELETE FROM paradas_trabajo WHERE trabajo_id = ?', [trabajo_id]);
  }

  /**
   * Obtiene resumen de paradas agregadas para una fecha específica
   */
  async getSummaryByDate(fecha, maquina_id = null) {
    const dateToQuery = fecha || new Date().toISOString().split('T')[0];
    let sql = `
      SELECT 
        t.maquina_id,
        pt.motivo_id,
        mp.nombre as motivo_nombre,
        mp.tipo as tipo,
        SUM(pt.minutos) as total_minutos
      FROM paradas_trabajo pt
      JOIN motivos_parada mp ON pt.motivo_id = mp.id
      JOIN trabajos t ON pt.trabajo_id = t.id
      WHERE t.fecha = ?
    `;
    const params = [dateToQuery];
    if (maquina_id) {
      sql += ' AND t.maquina_id = ?';
      params.push(maquina_id);
    }
    sql += ' GROUP BY t.maquina_id, pt.motivo_id, mp.nombre, mp.tipo ORDER BY total_minutos DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  /**
   * Obtiene resumen acumulado del mes (YYYY-MM)
   */
  async getSummaryByMonth(mes, maquina_id = null) {
    const monthToQuery = mes || new Date().toISOString().slice(0, 7); // YYYY-MM
    let sql = `
      SELECT 
        t.maquina_id,
        pt.motivo_id,
        mp.nombre as motivo_nombre,
        mp.tipo as tipo,
        SUM(pt.minutos) as total_minutos
      FROM paradas_trabajo pt
      JOIN motivos_parada mp ON pt.motivo_id = mp.id
      JOIN trabajos t ON pt.trabajo_id = t.id
      WHERE t.fecha LIKE ?
    `;
    const params = [`${monthToQuery}%`];
    if (maquina_id) {
      sql += ' AND t.maquina_id = ?';
      params.push(maquina_id);
    }
    sql += ' GROUP BY t.maquina_id, pt.motivo_id, mp.nombre, mp.tipo ORDER BY total_minutos DESC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  }
}

module.exports = new ParadasRepository();
