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
