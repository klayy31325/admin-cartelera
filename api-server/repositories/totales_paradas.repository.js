const { pool } = require('../config/db');

class TotalesParadasRepository {
  async upsertMany(maquina_id, mes, paradas) {
    if (!paradas) return;

    // Convertir a array uniforme de { motivo_id, total_minutos }
    let entries = [];
    if (Array.isArray(paradas)) {
      entries = paradas.map(p => ({ motivo_id: p.motivo_id, total_minutos: Number(p.total_minutos) || 0 }));
    } else if (typeof paradas === 'object') {
      // Forzar 18 motivos para tener registro completo (incluye ceros)
      entries = Array.from({ length: 18 }, (_, i) => ({
        motivo_id: i + 1,
        total_minutos: Number(paradas[i + 1]) || 0,
      }));
    }

    if (entries.length === 0) return;

    // Eliminar registros previos y re-insertar (garantiza datos limpios)
    await pool.execute(
      `DELETE FROM totales_paradas WHERE maquina_id = ? AND mes = ?`,
      [maquina_id, mes]
    );

    const values = entries.map(p => [maquina_id, mes, p.motivo_id, p.total_minutos]);
    const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
    const flat = values.flat();

    await pool.execute(
      `INSERT INTO totales_paradas (maquina_id, mes, motivo_id, total_minutos)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE total_minutos = VALUES(total_minutos)`,
      flat
    );
  }

  async findByMaquinaYMes(maquina_id, mes) {
    const [rows] = await pool.execute(
      `SELECT tp.*, m.nombre AS motivo_nombre
       FROM totales_paradas tp
       JOIN motivos_parada m ON tp.motivo_id = m.id
       WHERE tp.maquina_id = ? AND tp.mes = ?
       ORDER BY tp.motivo_id ASC`,
      [maquina_id, mes]
    );
    return rows;
  }

  async findByMes(mes) {
    const [rows] = await pool.execute(
      `SELECT tp.*, m.nombre AS motivo_nombre
       FROM totales_paradas tp
       JOIN motivos_parada m ON tp.motivo_id = m.id
       WHERE tp.mes = ?
       ORDER BY tp.maquina_id ASC, tp.motivo_id ASC`,
      [mes]
    );
    return rows;
  }

  async findByMaquinasYMes(maquina_ids, mes) {
    if (!maquina_ids || maquina_ids.length === 0) return [];
    const placeholders = maquina_ids.map(() => '?').join(',');
    const [rows] = await pool.execute(
      `SELECT tp.*, m.nombre AS motivo_nombre
       FROM totales_paradas tp
       JOIN motivos_parada m ON tp.motivo_id = m.id
       WHERE tp.maquina_id IN (${placeholders}) AND tp.mes = ?
       ORDER BY tp.maquina_id ASC, tp.motivo_id ASC`,
      [...maquina_ids, mes]
    );
    return rows;
  }

  async findByMaquinaYMonths(maquina_id, months) {
    if (!months || months.length === 0) return [];
    const placeholders = months.map(() => '?').join(',');
    let sql = `SELECT tp.*, m.nombre AS motivo_nombre
               FROM totales_paradas tp
               JOIN motivos_parada m ON tp.motivo_id = m.id
               WHERE tp.mes IN (${placeholders})`;
    const params = [...months];
    if (maquina_id) {
      sql += ' AND tp.maquina_id = ?';
      params.push(maquina_id);
    }
    sql += ' ORDER BY tp.mes ASC, tp.maquina_id ASC, tp.motivo_id ASC';
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async deleteByMaquinaYMes(maquina_id, mes) {
    await pool.execute(
      `DELETE FROM totales_paradas WHERE maquina_id = ? AND mes = ?`,
      [maquina_id, mes]
    );
  }
}

module.exports = new TotalesParadasRepository();
