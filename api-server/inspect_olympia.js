const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../EXEL DATOS MAQUINA.xlsx');
const wb = XLSX.readFile(filePath);

// --- OLYMPIA ---
console.log('═══════════════════════════════════════════════════════════════');
console.log('🔍 INSPECCIÓN DETALLADA - OLYMPIA');
console.log('═══════════════════════════════════════════════════════════════\n');

const ws = wb.Sheets['OLYMPIA'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
console.log(`Total rows: ${rows.length}`);

// Show rows around the break point (row 27 = OF= OLYMPIA FINAL)
console.log('\n--- Alrededor de OF= OLYMPIA FINAL (row 27) ---');
for (let i = 25; i <= 40; i++) {
  const row = rows[i];
  if (row) {
    console.log(`[${i}]:`, row.slice(0, 12).map((v,i) => `${i}:${v}`).join(' | '));
  } else {
    console.log(`[${i}]: (empty)`);
  }
}

// Check if there are more data sections after row 27
console.log('\n--- Buscando más datos después de row 27 ---');
let dataAfter27 = 0;
for (let i = 28; i < rows.length; i++) {
  const row = rows[i];
  if (row && row[0] && typeof row[0] === 'string' && row[0].trim() && 
      !row[0].trim().startsWith('OF=') && !row[0].trim().startsWith('OP=') &&
      !row[0].trim().startsWith('Nota') && !row[0].trim().startsWith('EL PROMEDIO')) {
    if (dataAfter27 < 20) {
      console.log(`[${i}]:`, row.slice(0, 12).map((v,i) => `${i}:${v}`).join(' | '));
    }
    dataAfter27++;
  }
}
console.log(`\nTotal filas con datos potenciales después de row 27: ${dataAfter27}`);

// Show last 20 rows of the sheet
console.log('\n--- Últimas 20 filas del sheet OLYMPIA ---');
for (let i = Math.max(0, rows.length - 20); i < rows.length; i++) {
  const row = rows[i];
  if (row) {
    console.log(`[${i}]:`, row.slice(0, 12).map((v,i) => `${i}:${v}`).join(' | '));
  } else {
    console.log(`[${i}]: (empty)`);
  }
}

// --- NOVOFLEX ---
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🔍 INSPECCIÓN DETALLADA - NOVOFLEX.');
console.log('═══════════════════════════════════════════════════════════════\n');

const ws2 = wb.Sheets['NOVOFLEX.'];
const rows2 = XLSX.utils.sheet_to_json(ws2, { header: 1 });
console.log(`Total rows: ${rows2.length}`);

// Show around the break point (row 74 = EL PROMEDIO)
console.log('\n--- Alrededor de EL PROMEDIO (row 74) ---');
for (let i = 70; i <= Math.min(91, rows2.length - 1); i++) {
  const row = rows2[i];
  if (row) {
    console.log(`[${i}]:`, row.slice(0, 12).map((v,i) => `${i}:${v}`).join(' | '));
  } else {
    console.log(`[${i}]: (empty)`);
  }
}
