const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('C:\\Users\\Admin\\OneDrive\\Documentos\\admin cartelera\\PRO-2026-05-CX - copia.xlsx');

['NOVOFLEX.', 'OLYMPIA'].forEach(function(sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) { console.log('Sheet not found:', sheetName); return; }
  
  const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
  const outName = sheetName.replace('.', '') + '.csv';
  fs.writeFileSync(outName, csv, 'utf8');
  console.log(outName + ' creado (' + csv.split('\n').length + ' lineas)');
});
