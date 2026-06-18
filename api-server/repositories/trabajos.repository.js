// ============================================================
// repositories/trabajos.repository.js
// ============================================================
const { pool } = require('../config/db');

// Parche global: undefined → null en TODOS los parámetros SQL
function sanitizeParams(params) {
  if (params && Array.isArray(params)) {
    const hasUndefined = params.some(p => p === undefined);
    if (hasUndefined) {
      console.error('⚠️ sanitizeParams encontró undefined:', params);
      console.error(new Error().stack);
    }
    return params.map(p => p === undefined ? null : p);
  }
  return params;
}
function sanitizeParamsDeep(params, depth = 0) {
  if (params && Array.isArray(params)) {
    const check = (arr) => arr.some(p => Array.isArray(p) ? check(p) : p === undefined);
    if (check(params)) {
      console.error('⚠️ sanitizeParamsDeep encontró undefined en depth', depth, ':', JSON.stringify(params));
    }
    return params.map(p => Array.isArray(p) ? sanitizeParamsDeep(p, depth + 1) : (p === undefined ? null : p));
  }
  return params;
}
const origExecute = pool.execute.bind(pool);
pool.execute = (sql, params, opts) => origExecute(sql, sanitizeParams(params), opts);
const origQuery = pool.query.bind(pool);
pool.query = (sql, params, opts) => origQuery(sql, sanitizeParamsDeep(params), opts);
const origGetConn = pool.getConnection.bind(pool);
pool.getConnection = async () => {
  const conn = await origGetConn();
  const origConnExec = conn.execute.bind(conn);
  conn.execute = (sql, params, opts) => origConnExec(sql, sanitizeParams(params), opts);
  const origConnQuery = conn.query.bind(conn);
  conn.query = (sql, params, opts) => origConnQuery(sql, sanitizeParamsDeep(params), opts);
  return conn;
};

// Mapeo: columna del Excel (índice) → motivo_id fijo en motivos_parada
const MOTIVOS_EXCEL_MAP = [
  { col: 11, id: 1  }, // PREPARACION
  { col: 12, id: 2  }, // PRE-PRENSA
  { col: 13, id: 3  }, // COLORIMETRIA
  { col: 14, id: 4  }, // CALIDAD
  { col: 15, id: 5  }, // MANTENIMIENTO
  { col: 16, id: 6  }, // LIMPIEZA GENERAL DE MAQUINA
  { col: 17, id: 7  }, // PLANIFICACION
  { col: 18, id: 8  }, // LIMPIEZA DE PLANCHA
  { col: 19, id: 9  }, // LIMPIEZA DE RODILLO
  { col: 20, id: 10 }, // LIMPIEZA DE TAMBOR CENTRAL
  { col: 21, id: 11 }, // PRODUCCION
  { col: 22, id: 12 }, // PRUEBAS
  { col: 23, id: 13 }, // LOGISTICA
  { col: 24, id: 14 }, // FALLAS ELECTRICAS
  { col: 25, id: 15 }, // APROBACIONES
  { col: 26, id: 16 }, // ESTANDAR DE COLOR
  { col: 27, id: 17 }, // RRHH
  { col: 28, id: 18 }, // FALTA DE INSUMO / PEDIDO
];

// ─── Sanitizador de parámetros SQL ─────────────────────────────────────────
function sqlParams(...args) {
  return args.map(a => a === undefined ? null : a);
}

// ─── Catálogos auxiliares ──────────────────────────────────────────────────

/**
 * Busca un cliente por nombre dentro de CUREX (empresa_id = 2).
 * Si no existe, lo crea. Retorna su id.
 */
async function getOrCreateCliente(conn, nombre) {
  const nombreNorm = nombre.trim().toUpperCase();
  const [[found]] = await conn.execute(
    'SELECT id FROM clientes WHERE UPPER(TRIM(nombre)) = ? AND empresa_id = 2',
    [nombreNorm]
  );
  if (found) return found.id;

  const [result] = await conn.execute(
    'INSERT INTO clientes (empresa_id, nombre) VALUES (2, ?)',
    [nombre.trim()]
  );
  return result.insertId;
}

/**
 * Busca un producto por nombre dentro del cliente dado.
 * Si no existe, lo crea. Retorna su id.
 */
async function getOrCreateProducto(conn, nombre, cliente_id) {
  const nombreNorm = nombre.trim().toUpperCase();
  const [[found]] = await conn.execute(
    'SELECT id FROM productos WHERE UPPER(TRIM(nombre)) = ? AND cliente_id = ?',
    [nombreNorm, cliente_id]
  );
  if (found) return found.id;

  const [result] = await conn.execute(
    'INSERT INTO productos (cliente_id, nombre) VALUES (?, ?)',
    [cliente_id, nombre.trim()]
  );
  return result.insertId;
}

/**
 * Busca el id de un destino por nombre. Retorna 1 (LAMINACION) si no existe.
 */
async function getDestinoId(conn, nombre) {
  const [[found]] = await conn.execute(
    'SELECT id FROM destinos WHERE UPPER(TRIM(nombre)) = ?',
    [nombre.trim().toUpperCase()]
  );
  return found ? found.id : 1;
}

/**
 * Busca el id de un estado de trabajo por nombre. Retorna 1 (PROCESO) si no existe.
 */
async function getEstadoId(conn, nombre) {
  const [[found]] = await conn.execute(
    'SELECT id FROM estados_trabajo WHERE UPPER(TRIM(nombre)) = ?',
    [nombre.trim().toUpperCase()]
  );
  return found ? found.id : 1;
}

/**
 * Busca el id de un turno por nombre. Retorna 1 (A) si no existe.
 */
async function getTurnoId(conn, nombre) {
  const [[found]] = await conn.execute(
    'SELECT id FROM turnos WHERE UPPER(TRIM(nombre)) = ?',
    [(nombre || 'A').trim().toUpperCase()]
  );
  return found ? found.id : 1;
}

// ─── Repository ────────────────────────────────────────────────────────────

class TrabajosRepository {

  /**
   * Crea un trabajo y sus paradas, velocidad y desperdicio dentro de una transacción.
   */
  async create(data, paradasMinutos, velocidadData = null, desperdicioData = null, options = {}) {
    const conn = options.connection || await pool.getConnection();
    const ownsTransaction = !options.connection;
    try {
      if (ownsTransaction) await conn.beginTransaction();

      // Resolver FKs de catálogo
      const cliente_id  = await getOrCreateCliente(conn, data.cliente);
      const producto_id = await getOrCreateProducto(conn, data.producto, cliente_id);
      const destino_id  = await getDestinoId(conn, data.destino || 'LAMINACION');
      const estado_id   = await getEstadoId(conn, data.status_orden || 'PROCESO');

      const [result] = await conn.execute(
        `INSERT INTO trabajos
          (maquina_id, cliente_id, producto_id, destino_id, estado_id,
           numero_pedido, fecha, meta_kg, produccion_kg, metros_producidos,
           tiempo_produccion_min, tiempo_parada_total_min, tiempo_total_min,
           parada_limpieza_min, parada_pruebas_min, parada_insumo_min, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        sqlParams(
          data.maquina_id, cliente_id, producto_id, destino_id, estado_id,
          data.numero_pedido, data.fecha, data.meta_kg || 0,
          data.produccion_kg || null, data.metros_producidos || 0,
          data.tiempo_produccion_min || 0,
          data.tiempo_parada_total_min || 0, data.tiempo_total_min || 0,
          data.parada_limpieza_min || 0, data.parada_pruebas_min || 0, data.parada_insumo_min || 0,
          data.observaciones || null
        )
      );

      const trabajo_id = result.insertId;

      // 1. Insertar paradas
      if (paradasMinutos && paradasMinutos.length > 0) {
        const vals = paradasMinutos.filter(p => p.minutos > 0).map(p => [trabajo_id, p.motivo_id, p.minutos]);
        if (vals.length > 0) {
          await conn.query('INSERT INTO paradas_trabajo (trabajo_id, motivo_id, minutos) VALUES ?', [vals]);
        }
      }

      // 2. Insertar Velocidad (si viene)
      if (velocidadData) {
        const turno_id = await getTurnoId(conn, velocidadData.turno || 'A');
        await conn.execute(
          `INSERT INTO velocidad (maquina_id, trabajo_id, turno_id, fecha, velocidad_teorica_mlmin, velocidad_real_mlmin)
           VALUES (?, ?, ?, ?, ?, ?)`,
          sqlParams(data.maquina_id, trabajo_id, turno_id, data.fecha, velocidadData.teorica, velocidadData.real)
        );
      }

      // 3. Insertar Desperdicio (si viene)
      if (desperdicioData && (desperdicioData.kg_film > 0 || desperdicioData.tinta_kg > 0 || desperdicioData.ml_film > 0 || desperdicioData.porcentaje_kg != null)) {
        await conn.execute(
          `INSERT INTO desperdicios (maquina_id, trabajo_id, cantidad_kg, cantidad_ml, porcentaje_kg, comentario, fecha)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          sqlParams(
            data.maquina_id, trabajo_id, 
            desperdicioData.kg_film || 0,
            desperdicioData.ml_film || 0,
            desperdicioData.porcentaje_kg || null,
            `Manual: Film ${desperdicioData.kg_film}kg, Tinta ${desperdicioData.tinta_kg}kg, m/l ${desperdicioData.ml_film}`,
            data.fecha
          )
        );
      }

      if (ownsTransaction) await conn.commit();
      return { id: trabajo_id, ...data, cliente_id, producto_id };
    } catch (err) {
      if (ownsTransaction) await conn.rollback();
      throw err;
    } finally {
      if (ownsTransaction) conn.release();
    }
  }

  /**
   * Lista trabajos por máquina y rango de fechas.
   * Usado por verifyExcel en el servicio.
   */
  async findByMaquinaYPeriodo(maquina_id, fecha_inicio, fecha_fin) {
    const [rows] = await pool.query(
      `SELECT t.id, t.numero_pedido, t.fecha, t.maquina_id
       FROM trabajos t
       WHERE t.maquina_id = ? AND t.fecha >= ? AND t.fecha <= ?`,
      [maquina_id, fecha_inicio, fecha_fin]
    );
    return rows;
  }

  /**
   * Lista minutos de paradas por trabajo para una máquina y período.
   * Usado por verifyExcel en el servicio.
   */
  async findParadasByMaquinaYPeriodo(maquina_id, fecha_inicio, fecha_fin) {
    const [rows] = await pool.query(
      `SELECT pt.trabajo_id, pt.motivo_id, pt.minutos
       FROM paradas_trabajo pt
       JOIN trabajos t ON pt.trabajo_id = t.id
       WHERE t.maquina_id = ? AND t.fecha >= ? AND t.fecha <= ?`,
      [maquina_id, fecha_inicio, fecha_fin]
    );
    return rows;
  }

  /**
   * Verifica duplicado por numero_pedido + maquina_id + fecha
   */
  async existsByPedidoMaquinaFecha(numero_pedido, maquina_id, fecha) {
    const [rows] = await pool.execute(
      'SELECT id FROM trabajos WHERE numero_pedido = ? AND maquina_id = ? AND fecha = ?',
      [numero_pedido, maquina_id, fecha]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Listar trabajos con JOINs completos para mostrar nombres normalizados
   */
  async findAll({ maquina_id, fecha_inicio, fecha_fin, estado_id, status_orden } = {}) {
    let query = `
      SELECT
        t.id, t.numero_pedido, t.fecha, t.meta_kg, t.metros_producidos,
        t.tiempo_produccion_min, t.tiempo_parada_total_min, t.tiempo_total_min,
        t.observaciones, t.created_at,
        m.nombre   AS maquina_nombre,
        c.nombre   AS cliente,
        p.nombre   AS producto,
        d.nombre   AS destino,
        e.nombre   AS status_orden
      FROM trabajos t
      JOIN maquinas       m  ON t.maquina_id  = m.id
      JOIN clientes       c  ON t.cliente_id  = c.id
      JOIN productos      p  ON t.producto_id = p.id
      JOIN destinos       d  ON t.destino_id  = d.id
      JOIN estados_trabajo e ON t.estado_id   = e.id
      WHERE 1=1
    `;
    const params = [];

    if (maquina_id)   { query += ' AND t.maquina_id = ?';  params.push(maquina_id); }
    if (fecha_inicio) { query += ' AND t.fecha >= ?';       params.push(fecha_inicio); }
    if (fecha_fin)    { query += ' AND t.fecha <= ?';       params.push(fecha_fin); }
    if (estado_id)    { query += ' AND t.estado_id = ?';    params.push(estado_id); }
    if (status_orden) { query += ' AND UPPER(TRIM(e.nombre)) = ?'; params.push(String(status_orden).trim().toUpperCase()); }

    query += ' ORDER BY t.fecha DESC, t.created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  /**
   * Listar trabajos con todos sus detalles (paradas, velocidad, desperdicio)
   * Ideal para exportación consolidada.
   */
  async findAllDetailed({ maquina_id, fecha_inicio, fecha_fin } = {}) {
    // 1. Obtener los trabajos base
    const trabajos = await this.findAll({ maquina_id, fecha_inicio, fecha_fin });
    if (trabajos.length === 0) return [];

    const ids = trabajos.map(t => t.id);

    // 2. Obtener Paradas detalladas para todos los IDs
    const [paradas] = await pool.query(
      `SELECT pt.trabajo_id, pt.motivo_id, pt.minutos, mp.nombre AS motivo_nombre
       FROM paradas_trabajo pt
       JOIN motivos_parada mp ON pt.motivo_id = mp.id
       WHERE pt.trabajo_id IN (?)`,
      [ids]
    );

    // 3. Obtener Velocidad para todos los IDs
    const [velocidades] = await pool.query(
      `SELECT v.*, tu.nombre AS turno
       FROM velocidad v
       JOIN turnos tu ON v.turno_id = tu.id
       WHERE v.trabajo_id IN (?)`,
      [ids]
    );

    // 4. Obtener Desperdicios para todos los IDs
    const [desperdicios] = await pool.query(
      `SELECT * FROM desperdicios WHERE trabajo_id IN (?)`,
      [ids]
    );

    // 5. Mapear todo al array de trabajos
    return trabajos.map(t => ({
      ...t,
      paradas: paradas.filter(p => p.trabajo_id === t.id),
      velocidad: velocidades.find(v => v.trabajo_id === t.id) || null,
      desperdicio: desperdicios.find(d => d.trabajo_id === t.id) || null,
    }));
  }

  /**
   * Obtener un trabajo con todas sus paradas, velocidad y desperdicio
   */
  async findById(id) {
    const [[trabajo]] = await pool.execute(
      `SELECT t.*,
        m.nombre AS maquina_nombre,
        c.nombre AS cliente,
        p.nombre AS producto,
        d.nombre AS destino,
        e.nombre AS status_orden
       FROM trabajos t
       JOIN maquinas m ON t.maquina_id = m.id
       JOIN clientes c ON t.cliente_id = c.id
       JOIN productos p ON t.producto_id = p.id
       JOIN destinos d ON t.destino_id = d.id
       JOIN estados_trabajo e ON t.estado_id = e.id
       WHERE t.id = ?`,
      [id]
    );
    if (!trabajo) return null;

    // 1. Obtener Paradas
    const [paradas] = await pool.execute(
      `SELECT pt.motivo_id, pt.minutos, mp.nombre AS motivo_nombre, mp.tipo
       FROM paradas_trabajo pt
       JOIN motivos_parada mp ON pt.motivo_id = mp.id
       WHERE pt.trabajo_id = ?`,
      [id]
    );

    // 2. Obtener Velocidad
    const [[velocidad]] = await pool.execute(
      `SELECT v.*, tu.nombre AS turno
       FROM velocidad v
       JOIN turnos tu ON v.turno_id = tu.id
       WHERE v.trabajo_id = ?`,
      [id]
    );

    // 3. Obtener Desperdicio
    const [[desperdicio]] = await pool.execute(
      `SELECT * FROM desperdicios WHERE trabajo_id = ?`,
      [id]
    );

    return { 
      ...trabajo, 
      paradas, 
      velocidad: velocidad || null, 
      desperdicio: desperdicio || null 
    };
  }

  /**
   * Actualizar un trabajo con paradas, velocidad y desperdicio
   */
  async update(id, data, paradasMinutos, velocidadData = null, desperdicioData = null, options = {}) {
    const conn = options.connection || await pool.getConnection();
    const ownsTransaction = !options.connection;
    try {
      if (ownsTransaction) await conn.beginTransaction();

      const cliente_id  = await getOrCreateCliente(conn, data.cliente);
      const producto_id = await getOrCreateProducto(conn, data.producto, cliente_id);
      const destino_id  = await getDestinoId(conn, data.destino || 'LAMINACION');
      const estado_id   = await getEstadoId(conn, data.status_orden || 'PROCESO');

      // Construir SET dinámico: solo incluir paradas si vienen en data
      const setCols = [
        'maquina_id=?', 'cliente_id=?', 'producto_id=?', 'destino_id=?', 'estado_id=?',
        'numero_pedido=?', 'fecha=?', 'meta_kg=?', 'produccion_kg=?', 'metros_producidos=?',
        'tiempo_produccion_min=?', 'tiempo_parada_total_min=?', 'tiempo_total_min=?',
      ];
      const setVals = [
        data.maquina_id, cliente_id, producto_id, destino_id, estado_id,
        data.numero_pedido, data.fecha, data.meta_kg, data.produccion_kg || null,
        data.metros_producidos,
        data.tiempo_produccion_min, data.tiempo_parada_total_min, data.tiempo_total_min,
      ];
      if ('parada_limpieza_min' in data) {
        setCols.push('parada_limpieza_min=?');
        setVals.push(data.parada_limpieza_min || 0);
      }
      if ('parada_pruebas_min' in data) {
        setCols.push('parada_pruebas_min=?');
        setVals.push(data.parada_pruebas_min || 0);
      }
      if ('parada_insumo_min' in data) {
        setCols.push('parada_insumo_min=?');
        setVals.push(data.parada_insumo_min || 0);
      }
      setCols.push('observaciones=?');
      setVals.push(data.observaciones);
      setVals.push(id);

      await conn.execute(
        `UPDATE trabajos SET ${setCols.join(', ')} WHERE id=?`,
        sqlParams(...setVals)
      );

      // Paradas: Limpiar y re-insertar
      if (paradasMinutos) {
        await conn.execute('DELETE FROM paradas_trabajo WHERE trabajo_id = ?', [id]);
        const vals = paradasMinutos.filter(p => p.minutos > 0).map(p => [id, p.motivo_id, p.minutos]);
        if (vals.length > 0) {
          await conn.query('INSERT INTO paradas_trabajo (trabajo_id, motivo_id, minutos) VALUES ?', [vals]);
        }
      }

      // Velocidad: Limpiar y re-insertar
      if (velocidadData) {
        await conn.execute('DELETE FROM velocidad WHERE trabajo_id = ?', [id]);
        const turno_id = await getTurnoId(conn, velocidadData.turno || 'A');
        await conn.execute(
          `INSERT INTO velocidad (maquina_id, trabajo_id, turno_id, fecha, velocidad_teorica_mlmin, velocidad_real_mlmin)
           VALUES (?, ?, ?, ?, ?, ?)`,
          sqlParams(data.maquina_id, id, turno_id, data.fecha, velocidadData.teorica, velocidadData.real)
        );
      }

      // Desperdicio: Limpiar y re-insertar
      if (desperdicioData) {
        await conn.execute('DELETE FROM desperdicios WHERE trabajo_id = ?', [id]);
        if (desperdicioData.kg_film > 0 || desperdicioData.tinta_kg > 0 || desperdicioData.ml_film > 0 || desperdicioData.porcentaje_kg != null) {
          await conn.execute(
            `INSERT INTO desperdicios (maquina_id, trabajo_id, cantidad_kg, cantidad_ml, porcentaje_kg, comentario, fecha)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            sqlParams(
              data.maquina_id, id, 
              desperdicioData.kg_film || 0,
              desperdicioData.ml_film || 0,
              desperdicioData.porcentaje_kg || null,
              `Manual Update: Film ${desperdicioData.kg_film}kg, Tinta ${desperdicioData.tinta_kg}kg, m/l ${desperdicioData.ml_film}`,
              data.fecha
            )
          );
        }
      }

      if (ownsTransaction) await conn.commit();
      return { id, ...data };
    } catch (err) {
      if (ownsTransaction) await conn.rollback();
      throw err;
    } finally {
      if (ownsTransaction) conn.release();
    }
  }

  async delete(id) {
    const [result] = await pool.execute('DELETE FROM trabajos WHERE id = ?', [id]);
    return { affectedRows: result.affectedRows };
  }

  /**
   * Agregar totales mensuales desde trabajos y tablas relacionadas
   */
  async getResumenAggregated(maquina_id, months) {
    if (!months || months.length === 0) return [];
    const placeholders = months.map(() => '?').join(',');
    const params = [...months];
    let whereMachine = '';
    if (maquina_id) {
      whereMachine = ' AND t.maquina_id = ?';
      params.push(maquina_id);
    }
    const sql = `
      SELECT
        t.maquina_id,
        DATE_FORMAT(t.fecha, '%Y-%m') AS mes,
        m.nombre AS maquina_nombre,
        COUNT(DISTINCT t.id) AS total_trabajos,
        COALESCE(SUM(t.meta_kg), 0) AS meta_kg,
        COALESCE(SUM(t.produccion_kg), 0) AS produccion_kg,
        COALESCE(SUM(t.metros_producidos), 0) AS metros_ml,
        COALESCE(SUM(t.tiempo_produccion_min), 0) AS tiempo_prod_min,
        COALESCE(SUM(t.tiempo_parada_total_min), 0) AS tiempo_parada_min,
        COALESCE(SUM(t.tiempo_total_min), 0) AS tiempo_total_min,
        COALESCE(SUM(d.cantidad_kg), 0) AS desperdicio_kg,
        COALESCE(SUM(d.cantidad_ml), 0) AS desperdicio_ml,
        COALESCE(AVG(v.velocidad_teorica_mlmin), 0) AS vel_teorica_avg,
        COALESCE(AVG(v.velocidad_real_mlmin), 0) AS vel_real_avg
      FROM trabajos t
      JOIN maquinas m ON t.maquina_id = m.id
      LEFT JOIN desperdicios d ON d.trabajo_id = t.id
      LEFT JOIN velocidad v ON v.trabajo_id = t.id
      WHERE DATE_FORMAT(t.fecha, '%Y-%m') IN (${placeholders}) ${whereMachine}
      GROUP BY t.maquina_id, DATE_FORMAT(t.fecha, '%Y-%m'), m.nombre
      ORDER BY mes ASC, m.nombre ASC
    `;
    const [rows] = await pool.query(sql, params);
    return rows.map(r => ({
      ...r,
      desperdicio_pct_kg: r.produccion_kg > 0 ? parseFloat(((r.desperdicio_kg / r.produccion_kg) * 100).toFixed(2)) : null,
      desperdicio_pct_ml: r.metros_ml > 0 ? parseFloat(((r.desperdicio_ml / r.metros_ml) * 100).toFixed(2)) : null,
      tinta_blanco_kg: 0,
      tinta_varias_kg: 0,
      tinta_total_kg: 0,
    }));
  }

  /**
   * Agregar paradas mensuales desde paradas_trabajo
   */
  async getParadasAggregated(maquina_id, months) {
    if (!months || months.length === 0) return [];
    const placeholders = months.map(() => '?').join(',');
    const params = [...months];
    let whereMachine = '';
    if (maquina_id) {
      whereMachine = ' AND t.maquina_id = ?';
      params.push(maquina_id);
    }
    const sql = `
      SELECT
        t.maquina_id,
        DATE_FORMAT(t.fecha, '%Y-%m') AS mes,
        pt.motivo_id,
        mp.nombre AS motivo_nombre,
        COALESCE(SUM(pt.minutos), 0) AS total_minutos
      FROM paradas_trabajo pt
      JOIN trabajos t ON pt.trabajo_id = t.id
      JOIN motivos_parada mp ON pt.motivo_id = mp.id
      WHERE DATE_FORMAT(t.fecha, '%Y-%m') IN (${placeholders}) ${whereMachine}
      GROUP BY t.maquina_id, DATE_FORMAT(t.fecha, '%Y-%m'), pt.motivo_id, mp.nombre
      ORDER BY mes ASC, t.maquina_id ASC, pt.motivo_id ASC
    `;
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  /**
   * Métricas del día para el dashboard público
   */
  async getMetricasHoy(maquina_id) {
    const today = new Date().toISOString().split('T')[0];
    const [[metrics]] = await pool.execute(
      `SELECT
        COALESCE(SUM(metros_producidos), 0)     AS total_metros,
        COALESCE(SUM(tiempo_produccion_min), 0) AS total_prod_min,
        COALESCE(SUM(tiempo_total_min), 0)      AS total_min,
        COUNT(*)                                AS total_trabajos
       FROM trabajos
       WHERE maquina_id = ? AND fecha = ?`,
      [maquina_id, today]
    );
    return metrics;
  }

  // Helpers de resolución de catálogos (expuestos para el servicio de importación)
  static getOrCreateCliente  = getOrCreateCliente;
  static getOrCreateProducto = getOrCreateProducto;
  static getDestinoId        = getDestinoId;
  static getEstadoId         = getEstadoId;
  static getTurnoId          = getTurnoId;
  static get MOTIVOS_EXCEL_MAP() { return MOTIVOS_EXCEL_MAP; }
}

module.exports = new TrabajosRepository();
module.exports.MOTIVOS_EXCEL_MAP     = MOTIVOS_EXCEL_MAP;
module.exports.getOrCreateCliente    = getOrCreateCliente;
module.exports.getOrCreateProducto   = getOrCreateProducto;
module.exports.getDestinoId          = getDestinoId;
module.exports.getEstadoId           = getEstadoId;
module.exports.getTurnoId            = getTurnoId;
