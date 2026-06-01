// ============================================================
// repositories/produccion.repository.js — Acceso a tabla trabajos
// ============================================================
const { pool } = require('../config/db');

class ProduccionRepository {
  /**
   * Mapeo estricto de empresas — IDs fijos
   */
  async getEmpresaId(nombreEmpresa) {
    if (!nombreEmpresa) return null;
    const nombre = nombreEmpresa.toUpperCase();

    if (nombre.includes('CUREX') || nombre.includes('NOVOFLEX') || nombre.includes('OLYMPIA')) {
      return 2;
    }
    if (nombre.includes('MORROCEL')) {
      return 1;
    }

    const AppError = require('../utils/AppError');
    const { HTTP_STATUS } = require('../utils/constants');
    throw new AppError(
      `Identidad '${nombreEmpresa}' no autorizada.`,
      HTTP_STATUS.FORBIDDEN
    );
  }

  /**
   * Listar producción consolidada (Trabajos)
   */
  async findAll(empresa_id) {
    const [rows] = await pool.execute(`
      SELECT 
        t.id,
        t.metros_producidos,
        t.fecha,
        et.nombre as status_orden,
        m.nombre as maquina_nombre,
        p.nombre as producto,
        c.nombre as cliente,
        'listo' as maquina_estado,
        t.created_at
      FROM trabajos t
      JOIN maquinas m ON t.maquina_id = m.id
      JOIN productos p ON t.producto_id = p.id
      JOIN clientes c ON p.cliente_id = c.id
      JOIN estados_trabajo et ON t.estado_id = et.id
      WHERE m.empresa_id = ?
      ORDER BY t.fecha DESC, t.id DESC
    `, [empresa_id]);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.execute(`
      SELECT 
        t.id,
        t.metros_producidos,
        t.fecha,
        et.nombre as status_orden,
        m.nombre as maquina_nombre,
        p.nombre as producto,
        c.nombre as cliente
      FROM trabajos t
      JOIN maquinas m ON t.maquina_id = m.id
      JOIN productos p ON t.producto_id = p.id
      JOIN clientes c ON p.cliente_id = c.id
      JOIN estados_trabajo et ON t.estado_id = et.id
      WHERE t.id = ?
    `, [id]);
    return rows[0] || null;
  }

  async findOrCreateCliente(empresa_id, nombre) {
    const nombreNorm = nombre.trim().toUpperCase();
    const [rows] = await pool.execute(
      'SELECT id FROM clientes WHERE UPPER(TRIM(nombre)) = ? AND empresa_id = ?',
      [nombreNorm, empresa_id]
    );
    if (rows.length > 0) return rows[0].id;

    const [result] = await pool.execute(
      'INSERT INTO clientes (empresa_id, nombre) VALUES (?, ?)',
      [empresa_id, nombre.trim()]
    );
    return result.insertId;
  }

  async findOrCreateProducto(cliente_id, nombre) {
    const nombreNorm = nombre.trim().toUpperCase();
    const [rows] = await pool.execute(
      'SELECT id FROM productos WHERE UPPER(TRIM(nombre)) = ? AND cliente_id = ?',
      [nombreNorm, cliente_id]
    );
    if (rows.length > 0) return rows[0].id;

    const [result] = await pool.execute(
      'INSERT INTO productos (cliente_id, nombre) VALUES (?, ?)',
      [cliente_id, nombre.trim()]
    );
    return result.insertId;
  }

  async findOrCreateMaquina(empresa_id, nombre) {
    const nombreNorm = nombre.trim().toUpperCase();
    const [rows] = await pool.execute(
      'SELECT id FROM maquinas WHERE UPPER(TRIM(nombre)) = ? AND empresa_id = ?',
      [nombreNorm, empresa_id]
    );
    if (rows.length > 0) return rows[0].id;

    const [result] = await pool.execute(
      'INSERT INTO maquinas (empresa_id, nombre) VALUES (?, ?)',
      [empresa_id, nombreNorm]
    );
    return result.insertId;
  }

  async findOrCreateEstado(nombre) {
    const nombreNorm = nombre.trim().toUpperCase();
    const [rows] = await pool.execute(
      'SELECT id FROM estados_trabajo WHERE UPPER(TRIM(nombre)) = ?',
      [nombreNorm]
    );
    if (rows.length > 0) return rows[0].id;

    const [result] = await pool.execute(
      'INSERT INTO estados_trabajo (nombre) VALUES (?)',
      [nombreNorm]
    );
    return result.insertId;
  }

  async create(data) {
    const { cliente_id, producto_id, maquina_id, metros_producidos, fecha, estado_id, numero_pedido } = data;
    const [result] = await pool.execute(
      `INSERT INTO trabajos (cliente_id, producto_id, maquina_id, metros_producidos, fecha, estado_id, numero_pedido)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente_id,
        producto_id,
        maquina_id,
        metros_producidos || 0,
        fecha,
        estado_id || 1,
        numero_pedido || `MANUAL-${Date.now()}`
      ]
    );
    return { id: result.insertId, ...data };
  }

  async delete(id) {
    const [result] = await pool.execute('DELETE FROM trabajos WHERE id = ?', [id]);
    return { affectedRows: result.affectedRows };
  }

  async findAllByMaquina(maquina_id) {
    const [rows] = await pool.execute(`
      SELECT 
        t.id,
        t.metros_producidos,
        t.fecha,
        et.nombre as status_orden,
        m.nombre as maquina_nombre,
        p.nombre as producto,
        c.nombre as cliente
      FROM trabajos t
      JOIN maquinas m ON t.maquina_id = m.id
      JOIN productos p ON t.producto_id = p.id
      JOIN clientes c ON p.cliente_id = c.id
      JOIN estados_trabajo et ON t.estado_id = et.id
      WHERE t.maquina_id = ?
      ORDER BY t.fecha DESC, t.id DESC
    `, [maquina_id]);
    return rows;
  }

  /**
   * Obtiene resumen de producción agregada para una fecha específica
   */
  async getSummaryByDate(fecha, maquina_id = null) {
    const dateToQuery = fecha || new Date().toISOString().split('T')[0];
    let sql = `
      SELECT 
        m.id as maquina_id,
        m.nombre as maquina_nombre,
        COALESCE(SUM(t.metros_producidos), 0) as total_metros,
        15000 as objetivo_metros,
        COALESCE(SUM(t.metros_producidos) / 15000 * 100, 0) as eficiencia_promedio,
        COALESCE((
          SELECT SUM(pt.minutos)
          FROM paradas_trabajo pt
          JOIN trabajos tr ON pt.trabajo_id = tr.id
          WHERE tr.maquina_id = m.id AND tr.fecha = ?
        ), 0) as total_minutos
      FROM maquinas m
      LEFT JOIN trabajos t ON m.id = t.maquina_id AND t.fecha = ?
      WHERE 1=1
    `;
    const params = [dateToQuery, dateToQuery];
    if (maquina_id) {
      sql += ' AND m.id = ?';
      params.push(maquina_id);
    }
    sql += ' GROUP BY m.id, m.nombre';
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async getSummaryByMonth(mes, maquina_id = null) {
    const monthToQuery = mes || new Date().toISOString().slice(0, 7); // YYYY-MM
    let sql = `
      SELECT 
        m.id as maquina_id,
        m.nombre as maquina_nombre,
        COALESCE(SUM(t.metros_producidos), 0) as total_metros,
        15000 * 30 as objetivo_metros,
        COALESCE(SUM(t.metros_producidos) / (15000 * 30) * 100, 0) as eficiencia_promedio,
        COALESCE((
          SELECT SUM(pt.minutos)
          FROM paradas_trabajo pt
          JOIN trabajos tr ON pt.trabajo_id = tr.id
          WHERE tr.maquina_id = m.id AND tr.fecha LIKE ?
        ), 0) as total_minutos
      FROM maquinas m
      LEFT JOIN trabajos t ON m.id = t.maquina_id AND t.fecha LIKE ?
      WHERE 1=1
    `;
    const params = [`${monthToQuery}%`, `${monthToQuery}%`];
    if (maquina_id) {
      sql += ' AND m.id = ?';
      params.push(maquina_id);
    }
    sql += ' GROUP BY m.id, m.nombre';
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  /**
   * Obtiene la lista de trabajos individuales para una fecha
   */
  async getRecentTrabajos(fecha, maquina_id = null) {
    const dateToQuery = fecha || new Date().toISOString().split('T')[0];
    let sql = `
      SELECT 
        t.id, t.metros_producidos, t.created_at,
        m.nombre as maquina_nombre,
        p.nombre as producto_nombre,
        c.nombre as cliente_nombre
      FROM trabajos t
      JOIN maquinas m ON t.maquina_id = m.id
      JOIN productos p ON t.producto_id = p.id
      JOIN clientes c ON p.cliente_id = c.id
      WHERE t.fecha = ?
    `;
    const params = [dateToQuery];
    if (maquina_id) {
      sql += ' AND t.maquina_id = ?';
      params.push(maquina_id);
    }
    sql += ' ORDER BY t.created_at DESC LIMIT 10';
    const [rows] = await pool.execute(sql, params);
    return rows;
  }
}

module.exports = new ProduccionRepository();
