const { pool } = require('../config/db');

class ResumenExcelRepository {
  async upsert(maquina_id, mes, data) {
    const paradas = data.paradas || {};

    await pool.execute(
      `INSERT INTO resumen_excel
        (maquina_id, mes, meta_kg, metros_ml, produccion_kg,
         tiempo_prod_min, tiempo_parada_min, tiempo_total_min,
         desperdicio_ml, desperdicio_kg, desperdicio_pct_kg, desperdicio_pct_ml,
         total_trabajos, tinta_blanco_kg, tinta_varias_kg, tinta_total_kg,
         vel_real_avg, vel_teorica_avg,
         parada_1_min, parada_2_min, parada_3_min, parada_4_min, parada_5_min,
         parada_6_min, parada_7_min, parada_8_min, parada_9_min, parada_10_min,
         parada_11_min, parada_12_min, parada_13_min, parada_14_min, parada_15_min,
         parada_16_min, parada_17_min, parada_18_min)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
               ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        meta_kg=VALUES(meta_kg), metros_ml=VALUES(metros_ml),
        produccion_kg=VALUES(produccion_kg),
        tiempo_prod_min=VALUES(tiempo_prod_min),
        tiempo_parada_min=VALUES(tiempo_parada_min),
        tiempo_total_min=VALUES(tiempo_total_min),
        desperdicio_ml=VALUES(desperdicio_ml),
        desperdicio_kg=VALUES(desperdicio_kg),
        desperdicio_pct_kg=VALUES(desperdicio_pct_kg),
        desperdicio_pct_ml=VALUES(desperdicio_pct_ml),
        total_trabajos=VALUES(total_trabajos),
        tinta_blanco_kg=VALUES(tinta_blanco_kg),
        tinta_varias_kg=VALUES(tinta_varias_kg),
        tinta_total_kg=VALUES(tinta_total_kg),
        vel_real_avg=VALUES(vel_real_avg),
        vel_teorica_avg=VALUES(vel_teorica_avg),
        parada_1_min=VALUES(parada_1_min), parada_2_min=VALUES(parada_2_min),
        parada_3_min=VALUES(parada_3_min), parada_4_min=VALUES(parada_4_min),
        parada_5_min=VALUES(parada_5_min), parada_6_min=VALUES(parada_6_min),
        parada_7_min=VALUES(parada_7_min), parada_8_min=VALUES(parada_8_min),
        parada_9_min=VALUES(parada_9_min), parada_10_min=VALUES(parada_10_min),
        parada_11_min=VALUES(parada_11_min), parada_12_min=VALUES(parada_12_min),
        parada_13_min=VALUES(parada_13_min), parada_14_min=VALUES(parada_14_min),
        parada_15_min=VALUES(parada_15_min), parada_16_min=VALUES(parada_16_min),
        parada_17_min=VALUES(parada_17_min), parada_18_min=VALUES(parada_18_min)`,
      [
        maquina_id, mes,
        data.meta_kg, data.metros_ml, data.produccion_kg,
        data.tiempo_prod_min, data.tiempo_parada_min, data.tiempo_total_min,
        data.desperdicio_ml, data.desperdicio_kg, data.desperdicio_pct_kg,
        data.desperdicio_pct_ml,
        data.total_trabajos,
        data.tinta_blanco_kg, data.tinta_varias_kg, data.tinta_total_kg,
        data.vel_real_avg || 0, data.vel_teorica_avg || 0,
        paradas[1] || 0, paradas[2] || 0, paradas[3] || 0, paradas[4] || 0, paradas[5] || 0,
        paradas[6] || 0, paradas[7] || 0, paradas[8] || 0, paradas[9] || 0, paradas[10] || 0,
        paradas[11] || 0, paradas[12] || 0, paradas[13] || 0, paradas[14] || 0, paradas[15] || 0,
        paradas[16] || 0, paradas[17] || 0, paradas[18] || 0,
      ]
    );
  }

  async findByMaquinaYMes(maquina_id, mes) {
    const [rows] = await pool.execute(
      `SELECT * FROM resumen_excel WHERE maquina_id = ? AND mes = ? LIMIT 1`,
      [maquina_id, mes]
    );
    return rows[0] || null;
  }

  async findByMes(mes) {
    const [rows] = await pool.execute(
      `SELECT r.*, m.nombre AS maquina_nombre
       FROM resumen_excel r
       JOIN maquinas m ON r.maquina_id = m.id
       WHERE r.mes = ?
       ORDER BY m.nombre ASC`,
      [mes]
    );
    return rows;
  }

  async findUltimos(meses = 2) {
    const [rows] = await pool.execute(
      `SELECT r.*, m.nombre AS maquina_nombre
       FROM resumen_excel r
       JOIN maquinas m ON r.maquina_id = m.id
       ORDER BY r.mes DESC, m.nombre ASC
       LIMIT ?`,
      [meses * 5]
    );
    return rows;
  }
}

module.exports = new ResumenExcelRepository();
