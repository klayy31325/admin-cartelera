// ============================================================
// repositories/velocidad.repository.js
// ============================================================
const { pool } = require('../config/db');
const { getTurnoId } = require('./trabajos.repository');

class VelocidadRepository {
  async create(data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Resolver turno_id desde texto (A / B / C)
      const turno_id = await getTurnoId(conn, data.turno || 'A');

      const [result] = await conn.execute(
        `INSERT INTO velocidad
          (maquina_id, trabajo_id, turno_id, fecha,
           velocidad_teorica_mlmin, velocidad_real_mlmin, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.maquina_id,
          data.trabajo_id || null,
          turno_id,
          data.fecha,
          data.velocidad_teorica_mlmin || null,
          data.velocidad_real_mlmin    || null,
          data.observaciones           || null,
        ]
      );

      await conn.commit();
      return { id: result.insertId, ...data, turno_id };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async findAll({ maquina_id, fecha_inicio, fecha_fin } = {}) {
    let query = `
      SELECT
        v.id, v.fecha, v.velocidad_teorica_mlmin, v.velocidad_real_mlmin,
        v.observaciones, v.created_at,
        m.nombre AS maquina_nombre,
        tu.nombre AS turno,
        t.numero_pedido,
        ROUND(v.velocidad_real_mlmin / NULLIF(v.velocidad_teorica_mlmin,0) * 100, 1) AS rendimiento_pct
      FROM velocidad v
      JOIN maquinas m ON v.maquina_id = m.id
      JOIN turnos  tu ON v.turno_id   = tu.id
      LEFT JOIN trabajos t ON v.trabajo_id = t.id
      WHERE 1=1
    `;
    const params = [];
    if (maquina_id)   { query += ' AND v.maquina_id = ?'; params.push(maquina_id); }
    if (fecha_inicio) { query += ' AND v.fecha >= ?';     params.push(fecha_inicio); }
    if (fecha_fin)    { query += ' AND v.fecha <= ?';     params.push(fecha_fin); }
    query += ' ORDER BY v.fecha DESC, v.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async getResumenHoy(maquina_id) {
    const today = new Date().toISOString().split('T')[0];
    const [[resumen]] = await pool.execute(
      `SELECT
        ROUND(AVG(velocidad_teorica_mlmin), 2) AS promedio_teorica,
        ROUND(AVG(velocidad_real_mlmin), 2)    AS promedio_real,
        ROUND(AVG(velocidad_real_mlmin / NULLIF(velocidad_teorica_mlmin,0) * 100), 1) AS rendimiento_pct,
        COUNT(*) AS registros
       FROM velocidad
       WHERE maquina_id = ? AND fecha = ?`,
      [maquina_id, today]
    );
    return resumen;
  }

  async getSeriesHoy(maquina_id) {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.execute(
      `SELECT 
        DATE_FORMAT(created_at, '%H:%i') as hora,
        velocidad_real_mlmin as real,
        velocidad_teorica_mlmin as target
       FROM velocidad
       WHERE maquina_id = ? AND fecha = ?
       ORDER BY created_at ASC`,
      [maquina_id, today]
    );
    return rows;
  }
}

module.exports = new VelocidadRepository();
