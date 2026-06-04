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
  FECHA: 2, CLIENTE: 8, PRODUCTO: 9, META_KG: 10,
  TIEMPO_PARADA: 29, TIEMPO_PROD: 30, TIEMPO_TOTAL: 31,
  METROS_ML: 62, TINTA_TOTAL_KG: 71, VEL_TEORICA: 72, VEL_REAL: 73, DESP_ML: 74, DESP_KG: 78,
  OBSERVACIONES: 82, ESTADO: 83,
};

function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

function parseNum(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

async function main() {
  const filePath = path.join(__dirname, '../PRO-2026-05-CX - copia.xlsx');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📂 ANALIZANDO: PRO-2026-05-CX - copia.xlsx');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const wb = XLSX.readFile(filePath);
  console.log('Hojas:', wb.SheetNames.join(', '));

  for (const sheetName of wb.SheetNames) {
    if (['Gráfico1', 'Gráfico2', 'Gráfico3', 'Gráfico4', 'Listas', 'OEE', 'Hoja3'].includes(sheetName)) continue;

    const maquinaNombre = sheetName.replace(/\.$/, '');
    const maquina_id = maquinaNombre === 'OLYMPIA' ? 1 : maquinaNombre === 'NOVOFLEX' ? 2 : null;
    if (!maquina_id) { console.log(`\n⚠️  Saltando hoja: ${sheetName} (no reconocida)`); continue; }

    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🏭 ${maquinaNombre} — Filas totales: ${rows.length}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Mostrar estructura de primeras filas
    for (let i = 0; i < Math.min(16, rows.length); i++) {
      const r = rows[i];
      if (r && r.length > 0) {
        console.log(`[${i}]:`, r.slice(0, 12).map((v, j) => `${j}:${v}`).join(' | '));
      } else {
        console.log(`[${i}]: (empty)`);
      }
    }

    // Buscar fila de totales
    let totalRow = null;
    let totalIdx = -1;
    for (let i = 14; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;
      const txt = String(r[0]).trim().toUpperCase();
      if (txt.startsWith('OF=') || txt.startsWith('NF=') || txt.startsWith('TOTAL') || txt.startsWith('SUMA')) {
        totalRow = r;
        totalIdx = i;
        break;
      }
    }

    // Extraer datos
    const dataRows = [];
    let sumBK = 0, sumBN = 0;
    for (let i = 14; i < (totalIdx > 0 ? totalIdx : rows.length); i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;
      const pc = String(r[0]).trim();
      if (pc.startsWith('OF=') || pc.startsWith('NF=') || pc.startsWith('OP=') || pc.startsWith('NP=') ||
          pc.startsWith('Nota') || pc.startsWith('EL PROMEDIO') || pc.startsWith('TOTAL') || pc.startsWith('SUMA'))
        break;
      const fechaStr = excelSerialToDate(r[COL.FECHA]);
      const bk = parseNum(r[62]);
      const bn = parseNum(r[65]);
      sumBK += bk;
      sumBN += bn;
      dataRows.push({
        idx: i, pedido: pc, fecha: fechaStr,
        meta: parseNum(r[COL.META_KG]),
        bk, bn,
        t_prod: parseInt(r[COL.TIEMPO_PROD]) || 0,
        t_parada: parseInt(r[COL.TIEMPO_PARADA]) || 0,
      });
    }

    console.log(`\n📊 DATOS DEL EXCEL (${dataRows.length} registros):`);
    console.log(`   Columna BK(62) — Total: ${sumBK.toFixed(2)}`);
    console.log(`   Columna BN(65) — Total: ${sumBN.toFixed(2)}`);

    if (totalRow) {
      console.log(`\n   Fila de totales [${totalIdx}]: "${String(totalRow[0]).trim()}"`);
      console.log(`   Col62(BK) en totales: ${totalRow[62]}`);
      console.log(`   Col65(BN) en totales: ${totalRow[65]}`);
      console.log(`   Col10(MetaKg): ${totalRow[10]}`);
      console.log(`   Col29(T.Parada): ${totalRow[29]}`);
      console.log(`   Col30(T.Prod): ${totalRow[30]}`);
      console.log(`   Col31(T.Total): ${totalRow[31]}`);
    }

    // Consultar DB para el mismo periodo (Mayo 2026)
    console.log(`\n🗄️  CONSULTANDO DB — Mayo 2026, ${maquinaNombre}:`);
    const [dbRows] = await pool.execute(
      `SELECT t.numero_pedido, t.fecha, t.meta_kg, t.metros_producidos,
              t.tiempo_produccion_min, t.tiempo_parada_total_min, t.tiempo_total_min
       FROM trabajos t
       WHERE t.maquina_id = ? AND t.fecha >= '2026-05-01' AND t.fecha <= '2026-05-31'
       ORDER BY t.fecha ASC, t.numero_pedido ASC`,
      [maquina_id]
    );

    const dbSum = {
      count: dbRows.length,
      meta: dbRows.reduce((s, t) => s + parseFloat(t.meta_kg || 0), 0),
      metros: dbRows.reduce((s, t) => s + parseFloat(t.metros_producidos || 0), 0),
      t_prod: dbRows.reduce((s, t) => s + parseInt(t.tiempo_produccion_min || 0), 0),
      t_parada: dbRows.reduce((s, t) => s + parseInt(t.tiempo_parada_total_min || 0), 0),
    };

    console.log(`   Registros en DB (Mayo): ${dbSum.count}`);
    console.log(`   Metros total DB: ${dbSum.metros.toFixed(2)}`);

    // COMPARACIÓN
    console.log(`\n⚖️  COMPARACIÓN:`);
    console.log(`   ┌──────────────────────┬──────────────┬──────────────┬──────────────┐`);
    console.log(`   │ Métrica               │ Excel (BK)   │ DB (Mayo)    │ Diferencia   │`);
    console.log(`   ├──────────────────────┼──────────────┼──────────────┼──────────────┤`);
    const diffMetros = sumBK - dbSum.metros;
    console.log(`   │ Metros producidos     │ ${sumBK.toFixed(2).padStart(12)} │ ${dbSum.metros.toFixed(2).padStart(12)} │ ${diffMetros.toFixed(2).padStart(12)} │`);
    console.log(`   │ Registros             │ ${String(dataRows.length).padStart(12)} │ ${String(dbSum.count).padStart(12)} │ ${String(dataRows.length - dbSum.count).padStart(12)} │`);
    console.log(`   └──────────────────────┴──────────────┴──────────────┴──────────────┘`);

    // Mostrar discrepancias por registro
    console.log(`\n   📋 Registro por registro (coinciden por numero_pedido):`);
    let match = 0, mismatch = 0, notFound = 0;
    for (const ex of dataRows) {
      const dbMatch = dbRows.filter(d => d.numero_pedido === ex.pedido);
      if (dbMatch.length === 0) {
        notFound++;
        console.log(`   ❌ "${ex.pedido}" (${ex.fecha}) → NO ENCONTRADO en DB`);
        continue;
      }
      const best = dbMatch.reduce((best, d) =>
        Math.abs(parseFloat(d.metros_producidos || 0) - ex.bk) < Math.abs(parseFloat(best.metros_producidos || 0) - ex.bk) ? d : best
      , dbMatch[0]);
      const diff = Math.abs(parseFloat(best.metros_producidos || 0) - ex.bk);
      if (diff > 1) {
        mismatch++;
        const fecha = best.fecha ? best.fecha.toISOString?.().split('T')[0] || best.fecha : '?';
        console.log(`   ⚠️  "${ex.pedido}" → Excel BK=${ex.bk} | DB=${best.metros_producidos} (diff=${diff.toFixed(0)}) [DB fecha=${fecha}]`);
      } else {
        match++;
      }
    }
    console.log(`\n   ✅ Coinciden: ${match} | ⚠️  Difieren: ${mismatch} | ❌ No encontrados: ${notFound}`);
    console.log(`   📌 Total Excel: ${dataRows.length} | Total DB Mayo: ${dbSum.count}`);
  }

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
