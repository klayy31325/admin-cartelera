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
  TIEMPO_PARADA: 29, TIEMPO_PROD: 30, TIEMPO_TOTAL: 31,
  METROS_ML: 62, SOLVENTE_LTS: 67, TINTA_BLANCO_KG: 69, TINTA_VARIAS_KG: 70,
  TINTA_TOTAL_KG: 71, VEL_TEORICA: 72, VEL_REAL: 73, DESP_ML: 74, DESP_KG: 78,
  OBSERVACIONES: 82, ESTADO: 83,
};

function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

function parseNum(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

async function main() {
  // ─── LEER EXCEL ─────────────────────────────────────────────────
  const filePath = path.join(__dirname, '../EXEL DATOS MAQUINA.xlsx');
  const wb = XLSX.readFile(filePath);

  for (const sheetName of ['OLYMPIA', 'NOVOFLEX.']) {
    const maquinaNombre = sheetName.replace(/\.$/, '');
    const maquina_id = maquinaNombre === 'OLYMPIA' ? 1 : 2;
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const dataRows = [];
    for (let i = 14; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;
      const pc = String(row[0]).trim();
      if (pc.startsWith('OF=') || pc.startsWith('OP=') || pc.startsWith('Nota') || pc.startsWith('EL PROMEDIO') ||
          pc.startsWith('NF=') || pc.startsWith('NP=') || pc.startsWith('TOTAL') || pc.startsWith('SUMA') || pc.startsWith('PROMEDIO'))
        break;
      const fechaStr = excelSerialToDate(row[COL.FECHA]);
      dataRows.push({
        idx: i,
        numero_pedido: pc,
        fecha: fechaStr,
        meta_kg: parseNum(row[COL.META_KG]),
        metros: parseNum(row[COL.METROS_ML]),
        t_prod: parseInt(row[COL.TIEMPO_PROD]) || 0,
        t_parada: parseInt(row[COL.TIEMPO_PARADA]) || 0,
        t_total: parseInt(row[COL.TIEMPO_TOTAL]) || 0,
        desp_ml: parseNum(row[COL.DESP_ML]),
        desp_kg: parseNum(row[COL.DESP_KG]),
        tinta: parseNum(row[COL.TINTA_TOTAL_KG]),
      });
    }

    console.log(`\n═══════════════════════════════════════════════════════════════`);
    console.log(`🔍 COMPARACIÓN DETALLADA: ${maquinaNombre}`);
    console.log(`   Excel: ${dataRows.length} registros`);
    console.log(`═══════════════════════════════════════════════════════════════`);

    // ─── BUSCAR EN DB ──────────────────────────────────────────────
    const [dbRows] = await pool.execute(
      `SELECT t.numero_pedido, t.fecha, t.meta_kg, t.metros_producidos,
              t.tiempo_produccion_min, t.tiempo_parada_total_min, t.tiempo_total_min,
              d.cantidad_ml AS desp_ml, d.cantidad_kg AS desp_kg, d.comentario
       FROM trabajos t
       LEFT JOIN desperdicios d ON d.trabajo_id = t.id
       WHERE t.maquina_id = ?
       ORDER BY t.fecha ASC, t.numero_pedido ASC`,
      [maquina_id]
    );

    console.log(`   DB: ${dbRows.length} registros\n`);

    // ─── COMPARAR REGISTRO POR REGISTRO ────────────────────────────
    let matchCount = 0;
    let mismatchCount = 0;
    let notFoundCount = 0;

    for (const ex of dataRows) {
      // Buscar en DB por numero_pedido exacto
      const matches = dbRows.filter(d => d.numero_pedido === ex.numero_pedido);

      if (matches.length === 0) {
        notFoundCount++;
        console.log(`❌ [${ex.idx}] Pedido "${ex.numero_pedido}" (${ex.fecha}) → NO ENCONTRADO en DB`);
        continue;
      }

      // Si hay múltiples, buscar el que más se acerque en fecha
      let bestMatch = matches[0];
      if (matches.length > 1) {
        // Preferir el que tenga metros similares
        const exMetros = ex.metros;
        bestMatch = matches.reduce((best, m) => {
          const mMetros = parseFloat(m.metros_producidos || 0);
          return Math.abs(mMetros - exMetros) < Math.abs(parseFloat(best.metros_producidos || 0) - exMetros) ? m : best;
        }, matches[0]);
      }

      const bm = bestMatch;
      const diffs = [];
      if (Math.abs(parseFloat(bm.metros_producidos || 0) - ex.metros) > 1) diffs.push(`metros: DB=${bm.metros_producidos} vs Excel=${ex.metros}`);
      if (Math.abs(parseInt(bm.tiempo_produccion_min || 0) - ex.t_prod) > 1) diffs.push(`t.prod: DB=${bm.tiempo_produccion_min} vs Excel=${ex.t_prod}`);
      if (Math.abs(parseInt(bm.tiempo_parada_total_min || 0) - ex.t_parada) > 1) diffs.push(`t.parada: DB=${bm.tiempo_parada_total_min} vs Excel=${ex.t_parada}`);

      if (diffs.length > 0) {
        mismatchCount++;
        const fechaStr = bm.fecha ? bm.fecha.toISOString().split('T')[0] : 'N/A';
        console.log(`⚠️  [${ex.idx}] Pedido "${ex.numero_pedido}" → DB fecha=${fechaStr}`);
        diffs.forEach(d => console.log(`     └ ${d}`));
      } else {
        matchCount++;
      }
    }

    console.log(`\n📊 Resumen ${maquinaNombre}:`);
    console.log(`   ✅ Coinciden exactamente: ${matchCount}`);
    console.log(`   ⚠️  Coinciden con diferencias: ${mismatchCount}`);
    console.log(`   ❌ No encontrados en DB: ${notFoundCount}`);
    console.log(`   📌 Total DB vs Excel: ${dbRows.length} vs ${dataRows.length} registros`);
  }

  await pool.end();
}

main().catch(console.error);
