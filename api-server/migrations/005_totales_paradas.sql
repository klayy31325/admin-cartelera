-- ============================================================
-- Migration 005: Normalizar paradas a tabla separada
-- ============================================================
-- Crea totales_paradas, migra datos, elimina columnas de resumen_excel
-- ============================================================

CREATE TABLE IF NOT EXISTS totales_paradas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  maquina_id INT NOT NULL,
  mes VARCHAR(7) NOT NULL,
  motivo_id INT NOT NULL,
  total_minutos DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_maquina_mes_motivo (maquina_id, mes, motivo_id)
);

-- Migrar datos existentes (solo filas con valores > 0)
INSERT INTO totales_paradas (maquina_id, mes, motivo_id, total_minutos)
SELECT r.maquina_id, r.mes, v.motivo_id, v.total_minutos FROM resumen_excel r
JOIN (
  SELECT id, 1 AS motivo_id, parada_1_min AS total_minutos FROM resumen_excel WHERE parada_1_min > 0
  UNION ALL SELECT id, 2, parada_2_min FROM resumen_excel WHERE parada_2_min > 0
  UNION ALL SELECT id, 3, parada_3_min FROM resumen_excel WHERE parada_3_min > 0
  UNION ALL SELECT id, 4, parada_4_min FROM resumen_excel WHERE parada_4_min > 0
  UNION ALL SELECT id, 5, parada_5_min FROM resumen_excel WHERE parada_5_min > 0
  UNION ALL SELECT id, 6, parada_6_min FROM resumen_excel WHERE parada_6_min > 0
  UNION ALL SELECT id, 7, parada_7_min FROM resumen_excel WHERE parada_7_min > 0
  UNION ALL SELECT id, 8, parada_8_min FROM resumen_excel WHERE parada_8_min > 0
  UNION ALL SELECT id, 9, parada_9_min FROM resumen_excel WHERE parada_9_min > 0
  UNION ALL SELECT id, 10, parada_10_min FROM resumen_excel WHERE parada_10_min > 0
  UNION ALL SELECT id, 11, parada_11_min FROM resumen_excel WHERE parada_11_min > 0
  UNION ALL SELECT id, 12, parada_12_min FROM resumen_excel WHERE parada_12_min > 0
  UNION ALL SELECT id, 13, parada_13_min FROM resumen_excel WHERE parada_13_min > 0
  UNION ALL SELECT id, 14, parada_14_min FROM resumen_excel WHERE parada_14_min > 0
  UNION ALL SELECT id, 15, parada_15_min FROM resumen_excel WHERE parada_15_min > 0
  UNION ALL SELECT id, 16, parada_16_min FROM resumen_excel WHERE parada_16_min > 0
  UNION ALL SELECT id, 17, parada_17_min FROM resumen_excel WHERE parada_17_min > 0
  UNION ALL SELECT id, 18, parada_18_min FROM resumen_excel WHERE parada_18_min > 0
) v ON r.id = v.id;

-- Eliminar columnas de parada de resumen_excel
ALTER TABLE resumen_excel
  DROP COLUMN parada_1_min,
  DROP COLUMN parada_2_min,
  DROP COLUMN parada_3_min,
  DROP COLUMN parada_4_min,
  DROP COLUMN parada_5_min,
  DROP COLUMN parada_6_min,
  DROP COLUMN parada_7_min,
  DROP COLUMN parada_8_min,
  DROP COLUMN parada_9_min,
  DROP COLUMN parada_10_min,
  DROP COLUMN parada_11_min,
  DROP COLUMN parada_12_min,
  DROP COLUMN parada_13_min,
  DROP COLUMN parada_14_min,
  DROP COLUMN parada_15_min,
  DROP COLUMN parada_16_min,
  DROP COLUMN parada_17_min,
  DROP COLUMN parada_18_min;
