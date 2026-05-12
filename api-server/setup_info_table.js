const mysql = require('mysql2/promise');

async function setup() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'admin_cartelera'
  });

  const sql = `
    CREATE TABLE IF NOT EXISTS informacion_diaria (
      id INT(11) NOT NULL AUTO_INCREMENT,
      empresa_id INT(11) NOT NULL,
      titulo VARCHAR(100) NOT NULL,
      contenido TEXT NOT NULL,
      prioridad ENUM('baja', 'media', 'alta') DEFAULT 'baja',
      fecha_publicacion DATE NOT NULL DEFAULT (CURRENT_DATE),
      fecha_expiracion DATE DEFAULT NULL,
      activo TINYINT(1) DEFAULT 1,
      PRIMARY KEY (id),
      KEY fk_info_empresa (empresa_id),
      CONSTRAINT fk_info_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await conn.execute(sql);
  console.log('Tabla informacion_diaria creada exitosamente.');
  await conn.end();
}

setup().catch(console.error);
