const mysql = require('mysql2/promise');
const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config();

(async () => {
  const filePath = path.join(__dirname, '..', '..', 'PRO-2026-05-CX - copia.xlsx');
  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames.find(n => n.toUpperCase().includes('NOVOFLEX'));
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

  let startRow = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    if (String(r[0]).trim() === 'PEDIDO' || String(r[0]).trim() === 'undefined') continue;
    if (r[2] && String(r[8] || '').trim()) { startRow = i; break; }
  }

  function excelSerialToDate(serial) {
    if (!serial || isNaN(serial)) return null;
    const utcDays = Math.floor(serial - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }

  const excelData = {};
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0] || typeof row[0] !== 'string' || row[0].trim() === '') continue;
    const pc = row[0].trim();
    if (pc.startsWith('OF=') || pc.startsWith('OP=') || pc.startsWith('Nota') || pc.startsWith('EL PROMEDIO')) break;
    const fecha = excelSerialToDate(row[2]);
    if (!fecha) continue;
    excelData[pc] = {
      fecha,
      metros: parseFloat(row[62]) || 0,
      t_prod: parseFloat(row[30]) || 0,
      t_parada: parseFloat(row[29]) || 0,
      t_total: parseFloat(row[31]) || 0,
      meta_kg: parseFloat(row[10]) || 0,
    };
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'admin_cartelera',
    waitForConnections: true,
  });

  const [trabajos] = await pool.execute(
    'SELECT id, numero_pedido, fecha, meta_kg, metros_producidos, tiempo_produccion_min, tiempo_parada_total_min, tiempo_total_min FROM trabajos WHERE maquina_id = 2'
  );

  const dbData = {};
  trabajos.forEach(t => { dbData[t.numero_pedido] = t; });

  let diffs = 0; let soloExcel = 0; let soloDb = 0;
  console.log('=== DIFERENCIAS EXCEL vs DB (NOVOFLEX) ===\n');

  for (const [pedido, ex] of Object.entries(excelData)) {
    const db = dbData[pedido];
    if (!db) { soloExcel++; continue; }
    const campos = [
      { n: 'METROS', ex: ex.metros, db: db.metros_producidos },
      { n: 'T_PROD', ex: ex.t_prod, db: db.tiempo_produccion_min },
      { n: 'T_PARADA', ex: ex.t_parada, db: db.tiempo_parada_total_min },
      { n: 'T_TOTAL', ex: ex.t_total, db: db.tiempo_total_min },
      { n: 'META_KG', ex: ex.meta_kg, db: db.meta_kg },
    ];
    let rowDiffs = campos.filter(c => Math.abs(Number(c.ex) - Number(c.db)) > 0.5);
    if (rowDiffs.length > 0) {
      diffs++;
      console.log('DIFERENCIA ' + diffs + ': ' + pedido + ' [' + ex.fecha + ']');
      rowDiffs.forEach(c => console.log('   ' + c.n + ': Excel=' + c.ex + ' | DB=' + c.db));
    }
  }

  for (const [pedido] of Object.entries(dbData)) {
    if (!excelData[pedido]) soloDb++;
  }

  console.log('\n--- RESUMEN ---');
  console.log('Excel:', Object.keys(excelData).length);
  console.log('DB:', trabajos.length);
  console.log('Diferencias:', diffs);
  console.log('Solo Excel:', soloExcel);
  console.log('Solo DB:', soloDb);
  if (soloDb > 0) console.log('(Solo DB = registros de otras fechas no cubiertas por este Excel)');
  await pool.end();
})();
