// ============================================================
// repositories/tv.repository.js — Acceso a tabla normalizada 'tvs'
// ============================================================
const { pool } = require('../config/db');

class TvRepository {
  async findAll(empresa_id) {
    const [rows] = await pool.execute(
      `SELECT t.*, d.nombre as departamento, m.nombre as maquina_nombre 
       FROM tvs t
       JOIN departamentos d ON t.departamento_id = d.id
       LEFT JOIN maquinas m ON t.maquina_id = m.id
       WHERE t.empresa_id = ? 
       ORDER BY t.id DESC`,
      [empresa_id]
    );
    return rows;
  }

  async findById(id, empresa_id) {
    const [rows] = await pool.execute(
      `SELECT t.*, d.nombre as departamento, m.nombre as maquina_nombre 
       FROM tvs t
       JOIN departamentos d ON t.departamento_id = d.id
       LEFT JOIN maquinas m ON t.maquina_id = m.id
       WHERE t.id = ? AND t.empresa_id = ?`,
      [id, empresa_id]
    );
    return rows[0] || null;
  }

  async findByIp(ipAddress, empresa_id) {
    const [rows] = await pool.execute(
      `SELECT t.*, d.nombre as departamento 
       FROM tvs t
       JOIN departamentos d ON t.departamento_id = d.id
       WHERE t.ip_address = ? AND t.empresa_id = ?`,
      [ipAddress, empresa_id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { empresa_id, departamento_id, informacion, ip_address, estado_conexion } = data;
    const uid = data.uid || `TV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const [result] = await pool.execute(
      `INSERT INTO tvs (uid, empresa_id, departamento_id, informacion, ip_address, estado_conexion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uid, empresa_id, departamento_id, informacion, ip_address, estado_conexion]
    );
    return { id: result.insertId, ...data, uid };
  }

  async update(id, data) {
    const { departamento_id, informacion, ip_address, estado_conexion, maquina_id, empresa_id } = data;
    const [result] = await pool.execute(
      `UPDATE tvs 
       SET departamento_id = ?, informacion = ?, ip_address = ?, estado_conexion = ?, maquina_id = ?
       WHERE id = ? AND empresa_id = ?`,
      [departamento_id, informacion, ip_address, estado_conexion, maquina_id || null, id, empresa_id]
    );
    return { affectedRows: result.affectedRows };
  }

  async delete(id, empresa_id) {
    const [result] = await pool.execute(
      'DELETE FROM tvs WHERE id = ? AND empresa_id = ?',
      [id, empresa_id]
    );
    return { affectedRows: result.affectedRows };
  }
  async registerConnection(uid, data) {
    const { ip_address, estado_conexion, departamento_id, informacion, empresa_id = 2 } = data;
    
    // 1. Intentar buscar por UID
    let [rows] = await pool.execute(`
      SELECT t.id, t.maquina_id, m.nombre as maquina_nombre 
      FROM tvs t
      LEFT JOIN maquinas m ON t.maquina_id = m.id
      WHERE t.uid = ?
    `, [uid]);
    
    // 2. Si no hay por UID, intentar por IP (para vincular registros creados manualmente en Admin)
    if (rows.length === 0 && ip_address) {
      const [ipRows] = await pool.execute(`
        SELECT t.id, t.maquina_id, m.nombre as maquina_nombre 
        FROM tvs t
        LEFT JOIN maquinas m ON t.maquina_id = m.id
        WHERE t.ip_address = ? AND (t.uid IS NULL OR t.uid = '' OR t.uid = 'null')
        LIMIT 1
      `, [ip_address]);
      
      if (ipRows.length > 0) {
        console.log(`[TV] Vinculando nuevo UID ${uid} a TV existente por IP: ${ip_address}`);
        await pool.execute('UPDATE tvs SET uid = ? WHERE id = ?', [uid, ipRows[0].id]);
        rows = ipRows;
      }
    }

    if (rows.length > 0) {
      // 3. Si existe, actualizar estado e IP
      await pool.execute(
        'UPDATE tvs SET ip_address = ?, estado_conexion = ? WHERE uid = ?',
        [ip_address || null, estado_conexion || 'offline', uid]
      );
      return { 
        id: rows[0].id, 
        uid, 
        status: 'updated', 
        config: { 
          maquina_id: rows[0].maquina_id, 
          maquina_nombre: rows[0].maquina_nombre 
        } 
      };
    } else {
      // 4. Si no existe nada, crear registro nuevo
      const [result] = await pool.execute(
        `INSERT INTO tvs (uid, empresa_id, departamento_id, informacion, ip_address, estado_conexion)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uid, empresa_id, departamento_id || 1, informacion || 'TV AUTO-REGISTRADA', ip_address || null, estado_conexion || 'offline']
      );
      return { id: result.insertId, uid, status: 'created', config: { maquina_id: null, maquina_nombre: null } };
    }
  }

  async updateStatusByUid(uid, status) {
    await pool.execute(
      'UPDATE tvs SET estado_conexion = ? WHERE uid = ?',
      [status, uid]
    );
  }
}

module.exports = new TvRepository();
