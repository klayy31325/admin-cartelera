const { pool } = require('../config/db');

class DesperdiciosRepository {
  async create(data) {
    const { maquina_id, cantidad_kg, cantidad_ml, porcentaje_kg, comentario, fecha, trabajo_id } = data;
    const [result] = await pool.execute(
      'INSERT INTO desperdicios (maquina_id, trabajo_id, cantidad_kg, cantidad_ml, porcentaje_kg, comentario, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [maquina_id, trabajo_id || null, cantidad_kg, cantidad_ml, porcentaje_kg || null, comentario || null, fecha || new Date()]
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

  async getSummaryByDate(fecha, maquina_id = null) {
    const dateToQuery = fecha || new Date().toISOString().split('T')[0];
    let sql = `
      SELECT 
        COALESCE(SUM(d.cantidad_kg), 0) as total_kg,
        COALESCE(SUM(d.cantidad_ml), 0) as total_ml,
        ROUND(COALESCE(AVG(NULLIF(d.porcentaje_kg, 0)), 0), 4) as promedio_pct_kg,
        COALESCE(SUM(t.produccion_kg), 0) as total_produccion_kg,
        CASE WHEN COALESCE(SUM(t.produccion_kg), 0) > 0
          THEN ROUND(SUM(d.cantidad_kg) / SUM(t.produccion_kg) * 100, 2)
          ELSE 0
        END as pct_kg_total
      FROM desperdicios d
      LEFT JOIN trabajos t ON d.trabajo_id = t.id
      WHERE d.fecha = ?
    `;
    const params = [dateToQuery];
    if (maquina_id) {
      sql += ' AND d.maquina_id = ?';
      params.push(maquina_id);
    }
    const [[row]] = await pool.execute(sql, params);
    return row;
  }

  async getSummaryByMonth(mes, maquina_id = null) {
    const monthToQuery = mes || new Date().toISOString().slice(0, 7);
    let sql = `
      SELECT 
        COALESCE(SUM(d.cantidad_kg), 0) as total_kg,
        COALESCE(SUM(d.cantidad_ml), 0) as total_ml,
        ROUND(COALESCE(AVG(NULLIF(d.porcentaje_kg, 0)), 0), 4) as promedio_pct_kg,
        COALESCE(SUM(t.produccion_kg), 0) as total_produccion_kg,
        CASE WHEN COALESCE(SUM(t.produccion_kg), 0) > 0
          THEN ROUND(SUM(d.cantidad_kg) / SUM(t.produccion_kg) * 100, 2)
          ELSE 0
        END as pct_kg_total
      FROM desperdicios d
      LEFT JOIN trabajos t ON d.trabajo_id = t.id
      WHERE d.fecha LIKE ?
    `;
    const params = [`${monthToQuery}%`];
    if (maquina_id) {
      sql += ' AND d.maquina_id = ?';
      params.push(maquina_id);
    }
    const [[row]] = await pool.execute(sql, params);
    return row;
  }

  async getBreakdownByMachine(fecha = null, mes = null) {
    let sql = `
      SELECT 
        m.id as maquina_id,
        m.nombre as maquina_nombre,
        COALESCE(SUM(d.cantidad_kg), 0) as total_kg,
        COALESCE(SUM(d.cantidad_ml), 0) as total_ml,
        ROUND(COALESCE(AVG(NULLIF(d.porcentaje_kg, 0)), 0), 4) as promedio_pct_kg,
        COALESCE(SUM(t.produccion_kg), 0) as total_produccion_kg,
        CASE WHEN COALESCE(SUM(t.produccion_kg), 0) > 0
          THEN ROUND(SUM(d.cantidad_kg) / SUM(t.produccion_kg) * 100, 2)
          ELSE 0
        END as pct_kg_total
      FROM maquinas m
      LEFT JOIN desperdicios d ON m.id = d.maquina_id
        AND ${mes ? "d.fecha LIKE ?" : "d.fecha = ?"}
      LEFT JOIN trabajos t ON d.trabajo_id = t.id
      WHERE m.empresa_id = 2
    `;

    const params = [];
    if (mes) {
      params.push(`${mes}%`);
    } else {
      const dateToQuery = fecha || new Date().toISOString().split('T')[0];
      params.push(dateToQuery);
    }

    sql += `
      GROUP BY m.id, m.nombre
      ORDER BY total_kg DESC
    `;

    const [rows] = await pool.execute(sql, params);
    return rows;
  }
}

module.exports = new DesperdiciosRepository();
