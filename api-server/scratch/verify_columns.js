/**
 * Verificación de claims sobre columnas del Excel
 * Compara col actual vs col propuesta para cada fix sugerido
 */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.resolve(__dirname, '../../PRO-2026-05-CX - copia.xlsx');
const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: 'buffer', cellDates: false, cellNF: false, cellText: false });

console.log('Hojas:', wb.SheetNames.join(', '));

for (const sheetName of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true, defval: null });
  console.log(`\n${'='.repeat(60)}`);
  console.log(`HOJA: "${sheetName}" (${rows.length} filas)`);
  console.log('='.repeat(60));

  // Encontrar fila de encabezados (buscar "PREPARACION" en fila de encabezado)
  let headerRow = -1;
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const r = rows[i];
    if (!r) continue;
    for (let c = 0; c < (r.length || 0); c++) {
      if (String(r[c] || '').trim().toUpperCase() === 'PREPARACION') {
        headerRow = i;
        break;
      }
    }
    if (headerRow >= 0) break;
  }

  // Imprimir TODAS las celdas de filas de encabezado (2-3 filas arriba de datos)
  console.log('\n--- ENCABEZADOS (filas 0 a headerRow) ---');
  for (let i = Math.max(0, headerRow - 3); i <= headerRow; i++) {
    const r = rows[i];
    if (!r) continue;
    // Solo imprimir columnas relevantes
    const relevantCols = [49, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 78, 79, 82, 83, 84, 85];
    for (const c of relevantCols) {
      const v = r[c];
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        console.log(`  Fila ${i}, Col ${c}: "${String(v).trim()}"`);
      }
    }
  }

  // Encontrar primera fila de datos
  let startRow = headerRow + 1;
  for (let i = startRow; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    const col0 = String(r[0]).trim();
    if (col0 === 'PEDIDO' || col0 === 'undefined') continue;
    if (r[2] && String(r[8] || '').trim()) { startRow = i; break; }
  }

  // Verificar primeros 5 registros de datos con las columnas en disputa
  console.log(`\n--- PRIMEROS 5 REGISTROS (desde fila ${startRow}) ---`);
  console.log(`${'Fila'.padEnd(6)} ${'Pedido'.padEnd(15)} | Col66(actual PKG) | Col67(propuesto PKG) | Col49(prop Solv) | Col67(actual Solv) | Col82(obs) | Col83(estado act) | Col84(estado novo)`);
  
  let count = 0;
  for (let i = startRow; i < rows.length && count < 5; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;
    const col0 = String(row[0]).trim();
    if (col0.startsWith('OF=') || col0.startsWith('NF=') || col0.startsWith('Nota')) break;
    
    const pedido = col0.substring(0, 14);
    const col66 = row[66];
    const col67 = row[67];
    const col49 = row[49];
    const col82 = row[82];
    const col83 = row[83];
    const col84 = row[84];
    
    console.log(`  ${String(i+1).padEnd(5)} ${pedido.padEnd(15)} | ${String(col66).padEnd(18)} | ${String(col67).padEnd(20)} | ${String(col49).padEnd(16)} | ${String(col67).padEnd(18)} | ${String(col82).substring(0,10).padEnd(10)} | ${String(col83).padEnd(17)} | ${String(col84)}`);
    count++;
  }

  // Verificar TODOS los registros para estadísticas
  console.log('\n--- ESTADÍSTICAS COLUMNAS EN DISPUTA ---');
  let totalRows = 0;
  let col66_nonzero = 0, col67_nonzero = 0, col49_nonzero = 0;
  let col66_sum = 0, col67_sum = 0, col49_sum = 0;
  let col83_valid_status = 0, col84_valid_status = 0;
  const STATUS_VALIDOS = ['PROCESO', 'REPETICION', 'APROBACION', 'SUSPENDIDO', 'LIMPIEZA', 'PRUEBA', 'REPROCESO', 'FALTA DE INSUMO', 'PARADA PROGRAMADA'];
  const col83_values = {};
  const col84_values = {};

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0] || typeof row[0] !== 'string') continue;
    const col0 = row[0].trim();
    if (col0.startsWith('OF=') || col0.startsWith('OP=') || col0.startsWith('NF=') || col0.startsWith('NP=') || col0.startsWith('Nota') || col0.startsWith('EL PROMEDIO')) break;
    
    totalRows++;
    const v66 = parseFloat(row[66]) || 0;
    const v67 = parseFloat(row[67]) || 0;
    const v49 = parseFloat(row[49]) || 0;
    
    if (v66 > 0) { col66_nonzero++; col66_sum += v66; }
    if (v67 > 0) { col67_nonzero++; col67_sum += v67; }
    if (v49 > 0) { col49_nonzero++; col49_sum += v49; }
    
    const s83 = String(row[83] || '').trim().toUpperCase();
    const s84 = String(row[84] || '').trim().toUpperCase();
    col83_values[s83] = (col83_values[s83] || 0) + 1;
    col84_values[s84] = (col84_values[s84] || 0) + 1;
    if (STATUS_VALIDOS.includes(s83)) col83_valid_status++;
    if (STATUS_VALIDOS.includes(s84)) col84_valid_status++;
  }

  console.log(`Total filas datos: ${totalRows}`);
  console.log(`\nPRODUCCION_KG claim (66→67):`);
  console.log(`  Col 66: ${col66_nonzero}/${totalRows} non-zero, sum=${col66_sum.toFixed(2)}`);
  console.log(`  Col 67: ${col67_nonzero}/${totalRows} non-zero, sum=${col67_sum.toFixed(2)}`);
  
  console.log(`\nSOLVENTE_LTS claim (67→49):`);
  console.log(`  Col 67 (actual): ${col67_nonzero}/${totalRows} non-zero, sum=${col67_sum.toFixed(2)}`);
  console.log(`  Col 49 (propuesto): ${col49_nonzero}/${totalRows} non-zero, sum=${col49_sum.toFixed(2)}`);
  
  console.log(`\nESTADO claim (83 vs 84):`);
  console.log(`  Col 83: ${col83_valid_status}/${totalRows} con estado válido`);
  console.log(`  Col 84: ${col84_valid_status}/${totalRows} con estado válido`);
  console.log(`  Col 83 valores:`, JSON.stringify(col83_values));
  console.log(`  Col 84 valores:`, JSON.stringify(col84_values));

  // EXTRA: Encabezados exactos de las columnas en disputa
  console.log('\n--- ENCABEZADOS EXACTOS COLUMNAS 45-85 ---');
  for (let hRow = Math.max(0, headerRow - 3); hRow <= headerRow; hRow++) {
    const r = rows[hRow];
    if (!r) continue;
    for (let c = 45; c <= 85; c++) {
      const v = r[c];
      if (v !== null && v !== undefined && String(v).trim() !== '') {
        console.log(`  [Encab fila ${hRow}] Col ${c}: "${String(v).trim()}"`);
      }
    }
  }
}
