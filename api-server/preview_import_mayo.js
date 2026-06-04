const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, port: parseInt(process.env.DB_PORT) || 3306,
  timezone: '+00:00', charset: 'utf8mb4',
});

const COL = {
  FECHA: 2, DESTINO: 5, CLIENTE: 8, PRODUCTO: 9, META_KG: 10,
  TIEMPO_PARADA: 29, TIEMPO_PROD: 30, TIEMPO_TOTAL: 31, METROS_ML: 62,
  SOLVENTE_LTS: 67, TINTA_BLANCO_KG: 69, TINTA_VARIAS_KG: 70, TINTA_TOTAL_KG: 71,
  VEL_TEORICA: 72, VEL_REAL: 73, DESP_ML: 74, DESP_KG: 78,
  OBSERVACIONES: 82, ESTADO: 83,
};

const PARADAS_COLS = [
  { col: 11, id: 1, nombre: 'PREPARACION' }, { col: 12, id: 2, nombre: 'PRE-PRENSA' },
  { col: 13, id: 3, nombre: 'COLORIMETRIA' }, { col: 14, id: 4, nombre: 'CALIDAD' },
  { col: 15, id: 5, nombre: 'MANTENIMIENTO' }, { col: 16, id: 6, nombre: 'LIMPIEZA GENERAL DE MAQUINA' },
  { col: 17, id: 7, nombre: 'PLANIFICACION' }, { col: 18, id: 8, nombre: 'LIMPIEZA DE PLANCHA' },
  { col: 19, id: 9, nombre: 'LIMPIEZA DE RODILLO' }, { col: 20, id: 10, nombre: 'LIMPIEZA DE TAMBOR CENTRAL' },
  { col: 21, id: 11, nombre: 'PRODUCCION' }, { col: 22, id: 12, nombre: 'PRUEBAS' },
  { col: 23, id: 13, nombre: 'LOGISTICA' }, { col: 24, id: 14, nombre: 'FALLAS ELECTRICAS' },
  { col: 25, id: 15, nombre: 'APROBACIONES' }, { col: 26, id: 16, nombre: 'ESTANDAR DE COLOR' },
  { col: 27, id: 17, nombre: 'RRHH' }, { col: 28, id: 18, nombre: 'FALTA DE INSUMO / PEDIDO' },
];

const MAQUINA_IDS = { 'OLYMPIA': 1, 'NOVOFLEX': 2 };
const STATUS_VALIDOS = ['PROCESO','REPETICION','APROBACION','SUSPENDIDO','LIMPIEZA','PRUEBA','REPROCESO','FALTA DE INSUMO','PARADA PROGRAMADA',];

function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  return new Date(Math.round((serial - 25569) * 86400 * 1000)).toISOString().split('T')[0];
}
function parseNum(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

async function previewImport() {
  const filePath = path.join(__dirname, '../PRO-2026-05-CX - copia.xlsx');
  const wb = XLSX.readFile(filePath);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📋 PREVIEW — Datos a importar desde PRO-2026-05-CX - copia.xlsx');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Datos actuales en DB para Mayo
  const [dbMayo] = await pool.execute(
    `SELECT maquina_id, COUNT(*) as count, COALESCE(SUM(metros_producidos),0) as total_metros
     FROM trabajos WHERE fecha >= '2026-05-01' AND fecha <= '2026-05-31'
     GROUP BY maquina_id`
  );
  const dbStats = {};
  dbMayo.forEach(r => { dbStats[r.maquina_id] = { count: r.count, metros: parseFloat(r.total_metros) }; });

  const allData = {};

  for (const sheetName of ['OLYMPIA', 'NOVOFLEX.']) {
    const maquinaNombre = sheetName.replace(/\.$/, '');
    const maquina_id = MAQUINA_IDS[maquinaNombre];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const dataRows = [];
    let totalBK = 0, totalBN = 0;

    for (let i = 14; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;
      const pc = String(row[0]).trim();
      if (pc.startsWith('OF=') || pc.startsWith('NF=') || pc.startsWith('OP=') || pc.startsWith('NP=') ||
          pc.startsWith('Nota') || pc.startsWith('EL PROMEDIO') || pc.startsWith('TOTAL') || pc.startsWith('SUMA'))
        break;
      const fecha = excelSerialToDate(row[COL.FECHA]);
      if (!fecha) continue;

      const bk = parseNum(row[62]);
      totalBK += bk;

      const paradasSum = PARADAS_COLS.reduce((s, p) => s + (parseInt(row[p.col]) || 0), 0);

      dataRows.push({
        pedido: pc, fecha, cliente: String(row[COL.CLIENTE] || '').trim(),
        producto: String(row[COL.PRODUCTO] || '').trim(),
        destino: ['LAMINACION','CORTE','TODAS'].includes(String(row[COL.DESTINO] || '').trim().toUpperCase())
          ? String(row[COL.DESTINO]).trim().toUpperCase() : 'LAMINACION',
        meta_kg: parseNum(row[COL.META_KG]),
        metros_bk: bk,
        t_prod: parseInt(row[COL.TIEMPO_PROD]) || 0,
        t_parada: parseInt(row[COL.TIEMPO_PARADA]) || 0,
        t_total: parseInt(row[COL.TIEMPO_TOTAL]) || 0,
      });
    }

    allData[maquinaNombre] = { dataRows, totalBK, count: dataRows.length };

    // Mostrar preview
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🏭 ${maquinaNombre}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    console.log(`📦 Excel:     ${dataRows.length} registros | Metros BK: ${totalBK.toFixed(2)}`);
    const db = dbStats[maquina_id];
    if (db) {
      console.log(`🗄️  DB actual:  ${db.count} registros | Metros: ${db.metros.toFixed(2)}`);
      console.log(`⚠️  Diferencia: ${(totalBK - db.metros).toFixed(2)} metros (${dataRows.length - db.count} registros)`);
    }

    console.log(`\n📋 Registros a importar:`);
    dataRows.forEach((r, i) => {
      // Verificar si ya existe en DB
      console.log(`   ${(i+1).toString().padStart(2)}) ${r.pedido.padEnd(12)} ${r.fecha} BK:${r.metros_bk.toString().padStart(8)} Prod:${r.t_prod} Parada:${r.t_parada} ${r.cliente.substring(0, 25)}`);
    });

    if (dataRows.length > 0) {
      const fechas = dataRows.map(r => r.fecha).sort();
      console.log(`\n   Rango fechas: ${fechas[0]} → ${fechas[fechas.length-1]}`);
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`⚠️  ADVERTENCIA: Se BORRARÁN todos los datos de Mayo en la DB`);
  console.log(`   antes de importar, para que coincidan exactamente con el Excel.`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);

  await pool.end();
  return allData;
}

previewImport().catch(console.error);
