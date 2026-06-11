const { pool } = require('../config/db');

class MetasParadaRepository {
  async upsertMany(maquina_id, mes, metas) {
    if (!metas || metas.length === 0) return;

    const values = metas.map(m => [maquina_id, mes, m.motivo_id, m.valor_limite]);
    const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
    const flat = values.flat();

    await pool.execute(
      `INSERT INTO metas_parada (maquina_id, mes, motivo_id, valor_limite)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE valor_limite = VALUES(valor_limite)`,
      flat
    );
  }

  async findByMes(mes) {
    const [rows] = await pool.execute(
      `SELECT mp.*, m.nombre AS motivo_nombre
       FROM metas_parada mp
       JOIN motivos_parada m ON mp.motivo_id = m.id
       WHERE mp.mes = ?
       ORDER BY mp.maquina_id ASC, mp.motivo_id ASC`,
      [mes]
    );
    return rows;
  }

  async findByMaquinaYMes(maquina_id, mes) {
    const [rows] = await pool.execute(
      `SELECT mp.*, m.nombre AS motivo_nombre
       FROM metas_parada mp
       JOIN motivos_parada m ON mp.motivo_id = m.id
       WHERE mp.maquina_id = ? AND mp.mes = ?
       ORDER BY mp.motivo_id ASC`,
      [maquina_id, mes]
    );
    return rows;
  }
}

module.exports = new MetasParadaRepository();
