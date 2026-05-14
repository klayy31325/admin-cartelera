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

  async getSummaryByDate(fecha, maquina_id = null) {
    const dateToQuery = fecha || new Date().toISOString().split('T')[0];
    let sql = `
      SELECT 
        COALESCE(SUM(cantidad_kg), 0) as total_kg,
        COALESCE(SUM(cantidad_ml), 0) as total_ml
      FROM desperdicios
      WHERE fecha = ?
    `;
    const params = [dateToQuery];
    if (maquina_id) {
      sql += ' AND maquina_id = ?';
      params.push(maquina_id);
    }
    const [[row]] = await pool.execute(sql, params);
    return row;
  }

  async getSummaryByMonth(mes, maquina_id = null) {
    const monthToQuery = mes || new Date().toISOString().slice(0, 7);
    let sql = `
      SELECT 
        COALESCE(SUM(cantidad_kg), 0) as total_kg,
        COALESCE(SUM(cantidad_ml), 0) as total_ml
      FROM desperdicios
      WHERE fecha LIKE ?
    `;
    const params = [`${monthToQuery}%`];
    if (maquina_id) {
      sql += ' AND maquina_id = ?';
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
        COALESCE(SUM(d.cantidad_ml), 0) as total_ml
      FROM maquinas m
      LEFT JOIN desperdicios d ON m.id = d.maquina_id 
    `;
    
    const params = [];
    if (mes) {
      sql += ' AND d.fecha LIKE ?';
      params.push(`${mes}%`);
    } else {
      const dateToQuery = fecha || new Date().toISOString().split('T')[0];
      sql += ' AND d.fecha = ?';
      params.push(dateToQuery);
    }

    sql += `
      WHERE m.empresa_id = 2
      GROUP BY m.id, m.nombre
      ORDER BY total_kg DESC
    `;

    const [rows] = await pool.execute(sql, params);
    return rows;
  }
}

module.exports = new DesperdiciosRepository();
