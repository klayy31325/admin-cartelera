// Prueba rápida para verificar que el import de NOVOFLEX funciona
const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'EXEL DATOS MAQUINA.xlsx');
const wb = xlsx.readFile(filePath);

// Leer hoja NOVOFLEX
const sheetName = wb.SheetNames.find(n => n.toUpperCase().includes('NOVOFLEX'));
console.log('Hoja encontrada:', sheetName);

const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

// Buscar header de paradas
for (let i = 0; i < 15; i++) {
  const r = rows[i];
  if (!r) continue;
  const col11 = r[11] ? String(r[11]).trim() : '';
  const col19 = r[19] ? String(r[19]).trim() : '';
  const col20 = r[20] ? String(r[20]).trim() : '';
  if (col11 === 'PREPARACION') {
    console.log(`\nFila ${i}: col11=${col11}, col19="${col19}", col20="${col20}"`);
    console.log(col19.includes('TAMBOR') ? '→ col19 es TAMBOR ⇒ se swapea' : '→ col19 es RODILLO ⇒ ok');
    break;
  }
}

// Mostrar primeras filas de datos
console.log('\n--- PRIMERAS FILAS DE DATOS ---');
let startRow = 0;
for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  if (!r || !r[0]) continue;
  if (String(r[0]).trim() === 'PEDIDO' || String(r[0]).trim() === 'undefined') continue;
  if (r[2] && String(r[8] || '').trim()) { startRow = i; break; }
}

for (let i = startRow; i < Math.min(startRow + 3, rows.length); i++) {
  const r = rows[i];
  if (!r || !r[0]) continue;
  console.log(`Fila ${i}: Pedido=${r[0]}, Fecha=${r[2]}, Cliente=${r[8]}`);
  console.log(`  col19=${r[19] || 0}, col20=${r[20] || 0} (paradas)`);
  console.log(`  Metros=${r[62] || 0}, TProd=${r[30] || 0}, TParada=${r[29] || 0}, TTotal=${r[31] || 0}`);
  console.log(`  DespML=${r[74] || 0}, DespKG=${r[78] || 0}`);
}

console.log('\n✅ Verificación completada');
