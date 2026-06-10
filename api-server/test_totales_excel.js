// test_totales_excel.js — Verifica la extracción de totales del Excel
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const EXCEL_PATH = path.join(__dirname, '..', 'PRO-2026-05-CX - copia.xlsx');
const MAQUINA = process.argv[2] || 'NOVOFLEX';

console.log(`\n📊 Leyendo totales para ${MAQUINA} desde: ${EXCEL_PATH}\n`);

const buffer = fs.readFileSync(EXCEL_PATH);
const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false, cellNF: false, cellText: false });

const targetName = MAQUINA.toUpperCase().replace(/\./g, '').trim();
const sheetName = wb.SheetNames.find(n => n.toUpperCase().replace(/\./g, '').trim() === targetName);

if (!sheetName) {
  console.error(`❌ Hoja "${MAQUINA}" no encontrada. Hojas:`, wb.SheetNames);
  process.exit(1);
}

const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true, defval: null });
console.log(`📄 Hoja encontrada: "${sheetName}" — ${rows.length} filas\n`);

// Buscar la fila de resumen (NF= / OF=)
const markerPrefix = MAQUINA === 'NOVOFLEX' ? 'NF=' : 'OF=';
let summaryRow = null;
let summaryIdx = -1;

for (let i = 0; i < rows.length; i++) {
  const val = String(rows[i][0] || '').trim().toUpperCase();
  if (val.startsWith(markerPrefix)) {
    summaryRow = rows[i];
    summaryIdx = i;
    break;
  }
}

if (!summaryRow) {
  console.error(`❌ No se encontró fila ${markerPrefix} en el Excel`);
  process.exit(1);
}

console.log(`✅ Fila de resumen encontrada en índice ${summaryIdx}\n`);

// Mapeo de columnas
const TOTALS = {
  total_trabajos: summaryRow[6],
  meta_kg: summaryRow[10],
  tiempo_parada: summaryRow[29],
  tiempo_prod: summaryRow[30],
  tiempo_total: summaryRow[31],
  metros_ml: summaryRow[62],
  produccion_kg: summaryRow[66],
  tinta_blanco: summaryRow[69],
  tinta_varias: summaryRow[70],
  tinta_total: summaryRow[71],
  desp_ml: summaryRow[74],
  desp_kg: summaryRow[78],
  desp_pct_kg: summaryRow[79],
};

console.log('═══════════════════════════════════════════════════');
console.log(`  📊 RESUMEN ${MAQUINA.toUpperCase()} — Totales del Excel`);
console.log('═══════════════════════════════════════════════════\n');

const labels = {
  total_trabajos: '👷 Total Trabajos',
  meta_kg: '🎯 Meta Kg',
  metros_ml: '📏 Metros Producidos (m/l)',
  produccion_kg: '⚖️  Producción (Kg)',
  tiempo_parada: '⏸️  Tiempo Parada (min)',
  tiempo_prod: '⚙️  Tiempo Producción (min)',
  tiempo_total: '🕐 Tiempo Total (min)',
  desp_ml: '🗑️  Desperdicio (m/l)',
  desp_kg: '🗑️  Desperdicio (Kg)',
  desp_pct_kg: '📉 Desperdicio % Kg',
  tinta_blanco: '⬜ Tinta Blanco (Kg)',
  tinta_varias: '🎨 Tinta Varias (Kg)',
  tinta_total: '🧪 Tinta Total (Kg)',
};

for (const [key, label] of Object.entries(labels)) {
  let val = TOTALS[key];
  if (val === null || val === undefined) {
    console.log(`  ${label}: [VACÍO]`);
    continue;
  }
  if (typeof val === 'number' && (key.includes('pct') || key === 'desp_pct_kg')) {
    console.log(`  ${label}: ${(val * 100).toFixed(2)}%`);
  } else if (typeof val === 'number') {
    console.log(`  ${label}: ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  } else {
    console.log(`  ${label}: ${val}`);
  }
}

console.log('\n═══════════════════════════════════════════════════');
console.log('  ✅ Extracción completada');
console.log('═══════════════════════════════════════════════════\n');
