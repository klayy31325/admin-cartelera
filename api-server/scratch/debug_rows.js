const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'PRO-2026-05-CX - copia.xlsx');
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames.find(n => n.toUpperCase().includes('NOVOFLEX'));
const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

console.log('Total rows:', rows.length);
console.log('Sheet:', sheetName);

// Show rows 24-32 (around row 28 error), 34-42 (row 38), 65-72 (row 69), 71-79 (rows 75,77)
const ranges = [[24,32],[34,42],[65,72],[71,80]];
for (const [start, end] of ranges) {
  console.log(`\n=== ROWS ${start}-${end} ===`);
  for (let i = start; i <= end && i < rows.length; i++) {
    const r = rows[i];
    if (!r) { console.log(`Row ${i}: EMPTY`); continue; }
    const pedido = r[0] !== undefined ? r[0] : '(empty)';
    const fecha = r[2] !== undefined ? r[2] : '(empty)';
    const cliente = r[8] !== undefined ? String(r[8]).slice(0,30) : '(empty)';
    const producto = r[9] !== undefined ? String(r[9]).slice(0,30) : '(empty)';
    const meta = r[10];
    const metros = r[62];
    const t_prod = r[30];
    const t_par = r[29];
    const t_tot = r[31];
    const desp = r[74];
    const vel = r[72];
    const obs = r[82];
    console.log(`Row ${i}: pedido=${pedido} fecha=${fecha} cl=${cliente} prod=${producto}`);
    console.log(`  meta=${meta} mts=${metros} tp=${t_prod} tpar=${t_par} ttot=${t_tot} desp=${desp} vel=${vel} obs=${obs}`);
    // Check for undefined in common COL fields
    const fields = [0,2,5,8,9,10,11,29,30,31,62,66,67,71,72,73,74,78,79,82,83];
    const undef = fields.filter(f => r[f] === undefined);
    if (undef.length > 0) console.log(`  UNDEFINED columns: [${undef.join(',')}]`);
  }
}
