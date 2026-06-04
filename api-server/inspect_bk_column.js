const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../EXEL DATOS MAQUINA.xlsx');
const wb = XLSX.readFile(filePath);

// Inspeccionar columna BK (índice 62 0-indexed) para cada fila de OLYMPIA
console.log('═══════════════════════════════════════════════════════════════');
console.log('🔍 INSPECCIÓN COLUMNA BK (índice 62) vs COLUMNAS CERCANAS');
console.log('═══════════════════════════════════════════════════════════════\n');

for (const sheetName of ['OLYMPIA', 'NOVOFLEX.']) {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\n━━━ ${sheetName} ━━━`);
  console.log('Filas 14-30 (datos + totales):');
  console.log('Pedido | Col59(BH) | Col60(BI) | Col61(BJ) | Col62(BK) | Col63(BL) | Col64(BM) | Col65(BN)');

  for (let i = 14; i < Math.min(75, rows.length); i++) {
    const row = rows[i];
    if (!row) { console.log(`[${i}]: (empty)`); continue; }
    const pedido = String(row[0] || '').trim();
    if (!pedido && !row[59] && !row[60] && !row[61] && !row[62]) continue;
    const vals = [59, 60, 61, 62, 63, 64, 65].map(c => {
      const v = row[c];
      return v !== undefined && v !== null ? v : '-';
    });
    console.log(`[${i}] ${pedido.padEnd(12)} | ${String(vals[0]).padEnd(10)} | ${String(vals[1]).padEnd(10)} | ${String(vals[2]).padEnd(10)} | ${String(vals[3]).padEnd(10)} | ${String(vals[4]).padEnd(10)} | ${String(vals[5]).padEnd(10)} | ${String(vals[6]).padEnd(10)}`);
  }
  
  // Mostrar fila de totales
  console.log('\nBuscando fila de totales (OF=/NF=)...');
  for (let i = 14; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;
    const pc = String(row[0]).trim().toUpperCase();
    if (pc.startsWith('OF=') || pc.startsWith('NF=')) {
      const vals = [59, 60, 61, 62, 63, 64, 65, 10, 29, 30, 31].map(c => {
        const v = row[c];
        return v !== undefined && v !== null ? v : '-';
      });
      console.log(`[${i}] ${pc}`);
      console.log(`  Col10(MetaKg)=${vals[7]} | Col29(T.Parada)=${vals[8]} | Col30(T.Prod)=${vals[9]} | Col31(T.Total)=${vals[10]}`);
      console.log(`  Col59(BH)=${vals[0]} | Col60(BI)=${vals[1]} | Col61(BJ)=${vals[2]} | Col62(BK)=${vals[3]} | Col63(BL)=${vals[4]} | Col64(BM)=${vals[5]} | Col65(BN)=${vals[6]}`);
    }
  }
}

// También inspeccionar las columnas de velocidad (71-75)
console.log('\n\n═══════════════════════════════════════════════════════════════');
console.log('🔍 COLUMNAS DE VELOCIDAD Y DESPERDICIO (69-78)');
console.log('═══════════════════════════════════════════════════════════════\n');

for (const sheetName of ['OLYMPIA', 'NOVOFLEX.']) {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\n━━━ ${sheetName} ━━━`);
  console.log('Pedido | Col69(TintaBl) | Col70(TintaVar) | Col71(TintaTot) | Col72(VelTeo) | Col73(VelReal) | Col74(DespML) | Col78(DespKG)');

  for (let i = 14; i < Math.min(75, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    const pedido = String(row[0] || '').trim();
    if (!pedido) continue;
    if (pedido.startsWith('OF=') || pedido.startsWith('NF=') || 
        pedido.startsWith('OP=') || pedido.startsWith('NP=') ||
        pedido.startsWith('Nota') || pedido.startsWith('EL PROMEDIO') ||
        pedido.startsWith('TOTAL') || pedido.startsWith('SUMA')) {
      const vals = [69, 70, 71, 72, 73, 74, 78].map(c => {
        const v = row[c]; return v !== undefined && v !== null ? v : '-';
      });
      console.log(`[${i}] ${pedido.padEnd(12)} | ${String(vals[0]).padEnd(10)} | ${String(vals[1]).padEnd(10)} | ${String(vals[2]).padEnd(10)} | ${String(vals[3]).padEnd(10)} | ${String(vals[4]).padEnd(10)} | ${String(vals[5]).padEnd(10)} | ${String(vals[6]).padEnd(10)}`);
      continue;
    }
    const vals = [69, 70, 71, 72, 73, 74, 78].map(c => {
      const v = row[c]; return v !== undefined && v !== null ? v : '-';
    });
    console.log(`[${i}] ${pedido.padEnd(12)} | ${String(vals[0]).padEnd(10)} | ${String(vals[1]).padEnd(10)} | ${String(vals[2]).padEnd(10)} | ${String(vals[3]).padEnd(10)} | ${String(vals[4]).padEnd(10)} | ${String(vals[5]).padEnd(10)} | ${String(vals[6]).padEnd(10)}`);
  }
}
