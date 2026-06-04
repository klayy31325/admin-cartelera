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

  async getResumenHoy(maquina_id = null) {
    const today = new Date().toISOString().split('T')[0];
    const baseWhere = 'WHERE t.fecha = ?';
    const params = [today];
    let maquinaWhere = '';
    if (maquina_id) {
      maquinaWhere = ' AND t.maquina_id = ?';
      params.push(maquina_id);
    }
    const sql = `
      SELECT
        ROUND(COALESCE(SUM(t.metros_producidos) / NULLIF(SUM(t.tiempo_produccion_min), 0), 0), 2) AS promedio_teorica,
        ROUND(COALESCE(SUM(t.metros_producidos) / NULLIF(SUM(t.tiempo_total_min) - COALESCE(SUM(t.parada_insumo_min),0) - COALESCE(SUM(t.parada_limpieza_min),0) - COALESCE(SUM(t.parada_pruebas_min),0), 0), 0), 2) AS promedio_real,
        ROUND(COALESCE(
          (SUM(t.metros_producidos) / NULLIF(SUM(t.tiempo_total_min) - COALESCE(SUM(t.parada_insumo_min),0) - COALESCE(SUM(t.parada_limpieza_min),0) - COALESCE(SUM(t.parada_pruebas_min),0), 0))
          / NULLIF((SUM(t.metros_producidos) / NULLIF(SUM(t.tiempo_produccion_min), 0)), 0) * 100,
        0), 1) AS rendimiento_pct,
        COUNT(t.id) AS registros
       FROM trabajos t
       ${baseWhere}${maquinaWhere}
    `;
    const [[resumen]] = await pool.execute(sql, params);
    return resumen;
  }

  async getSeriesHoy(maquina_id = null) {
    const today = new Date().toISOString().split('T')[0];
    let sql = `
      SELECT 
        DATE_FORMAT(created_at, '%H:%i') as hora,
        velocidad_real_mlmin as \`real\`,
        velocidad_teorica_mlmin as target
       FROM velocidad
       WHERE fecha = ?
    `;
    const params = [today];
    if (maquina_id) {
      sql += ' AND maquina_id = ?';
      params.push(maquina_id);
    }
    sql += ' ORDER BY created_at ASC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async getResumenMes(mes, maquina_id = null) {
    const monthToQuery = mes || new Date().toISOString().slice(0, 7);
    const baseWhere = 'WHERE t.fecha LIKE ?';
    const params = [`${monthToQuery}%`];
    let maquinaWhere = '';
    if (maquina_id) {
      maquinaWhere = ' AND t.maquina_id = ?';
      params.push(maquina_id);
    }
    const sql = `
      SELECT
        ROUND(COALESCE(SUM(t.metros_producidos) / NULLIF(SUM(t.tiempo_produccion_min), 0), 0), 2) AS promedio_teorica,
        ROUND(COALESCE(SUM(t.metros_producidos) / NULLIF(SUM(t.tiempo_total_min) - COALESCE(SUM(t.parada_insumo_min),0) - COALESCE(SUM(t.parada_limpieza_min),0) - COALESCE(SUM(t.parada_pruebas_min),0), 0), 0), 2) AS promedio_real,
        ROUND(COALESCE(
          (SUM(t.metros_producidos) / NULLIF(SUM(t.tiempo_total_min) - COALESCE(SUM(t.parada_insumo_min),0) - COALESCE(SUM(t.parada_limpieza_min),0) - COALESCE(SUM(t.parada_pruebas_min),0), 0))
          / NULLIF((SUM(t.metros_producidos) / NULLIF(SUM(t.tiempo_produccion_min), 0)), 0) * 100,
        0), 1) AS rendimiento_pct,
        COUNT(t.id) AS registros
       FROM trabajos t
       ${baseWhere}${maquinaWhere}
    `;
    const [[resumen]] = await pool.execute(sql, params);
    return resumen;
  }

  async getBreakdownByMachine(fecha = null, mes = null) {
    const datePattern = mes ? `${mes}%` : (fecha || new Date().toISOString().split('T')[0]);
    const sql = `
      SELECT 
        m.id as maquina_id,
        m.nombre as maquina_nombre,
        ROUND(COALESCE(SUM(t.metros_producidos) / NULLIF(SUM(t.tiempo_total_min) - COALESCE(SUM(t.parada_insumo_min),0) - COALESCE(SUM(t.parada_limpieza_min),0) - COALESCE(SUM(t.parada_pruebas_min),0), 0), 0), 1) as avg_real,
        ROUND(COALESCE(SUM(t.metros_producidos) / NULLIF(SUM(t.tiempo_produccion_min), 0), 0), 1) as avg_teorica,
        ROUND(COALESCE(
          (SUM(t.metros_producidos) / NULLIF(SUM(t.tiempo_total_min) - COALESCE(SUM(t.parada_insumo_min),0) - COALESCE(SUM(t.parada_limpieza_min),0) - COALESCE(SUM(t.parada_pruebas_min),0), 0))
          / NULLIF((SUM(t.metros_producidos) / NULLIF(SUM(t.tiempo_produccion_min), 0)), 0) * 100,
        0), 1) as rendimiento_pct
      FROM maquinas m
      JOIN trabajos t ON m.id = t.maquina_id AND t.fecha LIKE ?
      WHERE m.empresa_id = 2
      GROUP BY m.id, m.nombre
      ORDER BY rendimiento_pct DESC
    `;

    const [rows] = await pool.execute(sql, [datePattern]);
    return rows;
  }
}

module.exports = new VelocidadRepository();
