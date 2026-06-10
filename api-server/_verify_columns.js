const XLSX = require('xlsx');
const wb = XLSX.readFile('C:\\Users\\Admin\\OneDrive\\Documentos\\admin cartelera\\PRO-2026-05-CX - copia.xlsx');

// Test: raw cell access vs sheet_to_json for col 66 and 67
const ws = wb.Sheets['NOVOFLEX.'];
const range = XLSX.utils.decode_range(ws['!ref']);
console.log('NOVOFLEX range:', ws['!ref'], '-> cols 0..' + range.e.c);

// First data row (row 14 1-indexed = 13 0-indexed)
const rowIdx = 13;
console.log('\n=== Direct cell access for row ' + (rowIdx+1) + ' ===');
for (let c = 60; c <= 80; c++) {
  const cell = ws[XLSX.utils.encode_cell({r: rowIdx, c: c})];
  console.log('  col ' + c + ': ' + (cell ? cell.v : 'EMPTY'));
}

// Now check what sheet_to_json returns
console.log('\n=== sheet_to_json({header:1}) for row ' + (rowIdx+1) + ' ===');
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
const row = rows[rowIdx];
if (row) {
  for (let c = 60; c <= Math.min(row.length-1, 80); c++) {
    console.log('  idx ' + c + ': ' + row[c]);
  }
  console.log('\nTotal row length:', row.length);
}

// Now check the same row but formatted (like CSV)
console.log('\n=== sheet_to_json({header:1, raw: false}) for row ' + (rowIdx+1) + ' ===');
const rowsFormatted = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: null });
const rowF = rowsFormatted[rowIdx];
if (rowF) {
  for (let c = 60; c <= Math.min(rowF.length-1, 80); c++) {
    console.log('  idx ' + c + ': ' + rowF[c]);
  }
  console.log('\nTotal row length:', rowF.length);
}
