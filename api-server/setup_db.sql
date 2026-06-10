-- ============================================================
-- setup_db.sql
-- Run this in your MySQL database (admin_cartelera)
-- ============================================================

CREATE TABLE IF NOT EXISTS logs_actividad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  accion VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS resumen_excel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  maquina_id INT NOT NULL,
  mes VARCHAR(7) NOT NULL,
  meta_kg DECIMAL(12,2) DEFAULT 0,
  metros_ml DECIMAL(12,2) DEFAULT 0,
  produccion_kg DECIMAL(12,2) DEFAULT 0,
  tiempo_prod_min DECIMAL(10,2) DEFAULT 0,
  tiempo_parada_min DECIMAL(10,2) DEFAULT 0,
  tiempo_total_min DECIMAL(10,2) DEFAULT 0,
  desperdicio_ml DECIMAL(12,2) DEFAULT 0,
  desperdicio_kg DECIMAL(12,2) DEFAULT 0,
  desperdicio_pct_kg DECIMAL(6,2) DEFAULT 0,
  desperdicio_pct_ml DECIMAL(6,2) DEFAULT 0,
  parada_1_min DECIMAL(10,2) DEFAULT 0,
  parada_2_min DECIMAL(10,2) DEFAULT 0,
  parada_3_min DECIMAL(10,2) DEFAULT 0,
  parada_4_min DECIMAL(10,2) DEFAULT 0,
  parada_5_min DECIMAL(10,2) DEFAULT 0,
  parada_6_min DECIMAL(10,2) DEFAULT 0,
  parada_7_min DECIMAL(10,2) DEFAULT 0,
  parada_8_min DECIMAL(10,2) DEFAULT 0,
  parada_9_min DECIMAL(10,2) DEFAULT 0,
  parada_10_min DECIMAL(10,2) DEFAULT 0,
  parada_11_min DECIMAL(10,2) DEFAULT 0,
  parada_12_min DECIMAL(10,2) DEFAULT 0,
  parada_13_min DECIMAL(10,2) DEFAULT 0,
  parada_14_min DECIMAL(10,2) DEFAULT 0,
  parada_15_min DECIMAL(10,2) DEFAULT 0,
  parada_16_min DECIMAL(10,2) DEFAULT 0,
  parada_17_min DECIMAL(10,2) DEFAULT 0,
  parada_18_min DECIMAL(10,2) DEFAULT 0,
  total_trabajos INT DEFAULT 0,
  tinta_blanco_kg DECIMAL(10,2) DEFAULT 0,
  tinta_varias_kg DECIMAL(10,2) DEFAULT 0,
  tinta_total_kg DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_maquina_mes (maquina_id, mes)
);
