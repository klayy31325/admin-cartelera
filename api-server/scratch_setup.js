const { pool } = require('./config/db');

async function setup() {
  try {
    // 1. Vincular OLYMPIA-DEV con Máquina 1
    console.log('--- Configurando TV OLYMPIA-DEV ---');
    await pool.execute(`
      INSERT INTO tvs (uid, empresa_id, departamento_id, maquina_id, informacion, estado_conexion) 
      VALUES ('OLYMPIA-DEV', 2, 2, 1, 'DEV TEST SCREEN', 'online') 
      ON DUPLICATE KEY UPDATE maquina_id = 1, estado_conexion = 'online'
    `);
    console.log('✓ TV OLYMPIA-DEV vinculada a Olympia (ID 1)');

    // 2. Verificar datos de paradas para Mayo 2026
    console.log('\n--- Verificando Datos de Paradas (Mayo 2026) ---');
    const [rows] = await pool.execute(`
      SELECT 
        mp.nombre as motivo,
        SUM(pt.minutos) as minutos
      FROM paradas_trabajo pt
      JOIN motivos_parada mp ON pt.motivo_id = mp.id
      JOIN trabajos t ON pt.trabajo_id = t.id
      WHERE t.fecha LIKE '2026-05%'
      GROUP BY mp.id
    `);
    
    if (rows.length === 0) {
      console.log('⚠ No se encontraron paradas para el mes de Mayo.');
    } else {
      console.log(`✓ Se encontraron ${rows.length} motivos de parada:`);
      rows.forEach(r => console.log(`  - ${r.motivo}: ${r.minutos} min`));
    }

    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

setup();
