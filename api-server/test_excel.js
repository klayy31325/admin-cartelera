const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../EXEL DATOS MAQUINA.xlsx');
const wb = XLSX.readFile(filePath);

// Imprimir los nombres de las hojas
console.log('Sheets:', wb.SheetNames);

// Inspeccionar la hoja 'OLYMPIA'
const sheetName = 'OLYMPIA';
const ws = wb.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log('Total rows:', rows.length);

// Imprimir la fila de encabezados (suele estar arriba del renglón 14, tal vez fila 12 o 13)
console.log('Row 12:', rows[11]);
console.log('Row 13:', rows[12]);
console.log('Row 14:', rows[13]);

// Imprimir la primera fila de datos (fila 15, index 14)
console.log('Row 15:', rows[14]);
