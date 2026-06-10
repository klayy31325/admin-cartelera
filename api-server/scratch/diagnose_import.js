/**
 * Diagnóstico de importación Excel
 * Simula la lógica de importFromExcel sin tocar la DB
 * para detectar filas perdidas.
 */
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../../PRO-2026-05-CX - copia.xlsx');
const maquinaNombre = 'OLYMPIA'; // Cambiar si es otra máquina

const COL = {
  FECHA: 2, DESTINO: 5, CLIENTE: 8, PRODUCTO: 9, META_KG: 10,
  TIEMPO_PARADA: 29, TIEMPO_PROD: 30, TIEMPO_TOTAL: 31,
  METROS_ML: 62, SOLVENTE_LTS: 67, TINTA_BLANCO_KG: 69,
  TINTA_VARIAS_KG: 70, TINTA_TOTAL_KG: 71,
  VEL_TEORICA: 72, VEL_REAL: 73, DESP_ML: 74, DESP_KG: 78,
  OBSERVACIONES: 82, ESTADO: 83,
  PARADA_LIMPIEZA: 16, PARADA_PRUEBAS: 22, PARADA_INSUMO: 28,
  PRODUCCION_KG: 66, DESP_PCT_KG: 79,
};

function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

console.log('=== DIAGNÓSTICO DE IMPORTACIÓN EXCEL ===\n');
console.log(`Archivo: ${filePath}`);

const wb = XLSX.read(require('fs').readFileSync(filePath), { type: 'buffer', cellDates: false, cellNF: false, cellText: false });

console.log(`\nHojas encontradas: ${wb.SheetNames.join(', ')}`);

// Buscar hoja
const sheetName = wb.SheetNames.find(n =>
  n.toUpperCase().replace(/\./g, '').trim() === maquinaNombre.toUpperCase()
);

if (!sheetName) {
  // Intentar match parcial
  const partial = wb.SheetNames.find(n => n.toUpperCase().includes(maquinaNombre.toUpperCase()));
  console.log(`\n❌ Hoja "${maquinaNombre}" no encontrada exactamente.`);
  if (partial) console.log(`   Candidata parcial: "${partial}"`);
  
  // Probar con CADA hoja
  console.log('\n--- Análisis de TODAS las hojas ---');
  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: true, defval: null });
    console.log(`  Hoja "${sn}": ${rows.length} filas`);
  }
  process.exit(1);
}

console.log(`\nUsando hoja: "${sheetName}"`);

const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true, defval: null });
console.log(`Total filas en hoja: ${rows.length}`);

// Detectar fila de inicio (misma lógica que importFromExcel)
let startRow = 0;
for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  if (!r || !r[0]) continue;
  const col0 = String(r[0]).trim();
  if (col0 === 'PEDIDO' || col0 === 'undefined') continue;
  const fecha = r[2];
  const cliente = String(r[8] || '').trim();
  if (fecha && cliente) { startRow = i; break; }
}
console.log(`Fila de inicio detectada: ${startRow} (valor col[0]: "${rows[startRow]?.[0]}")`);

// Simular procesamiento
let procesadas = 0;
let saltadas_sin_datos = 0;
let saltadas_break = 0;
let saltadas_error = 0;
let total_metros = 0;
let total_desp_kg = 0;
let total_desp_ml = 0;
let total_vel_real = 0;
let vel_count = 0;
let total_paradas_min = 0;
let breakReason = null;

const skippedRows = [];
const processedRows = [];

for (let i = startRow; i < rows.length; i++) {
  const row = rows[i];

  // Detectar fin de datos (MISMA lógica que importFromExcel)
  if (!row || !row[0] || typeof row[0] !== 'string' || row[0].trim() === '') {
    saltadas_sin_datos++;
    skippedRows.push({ fila: i + 1, razon: 'Fila vacía o col[0] vacío', col0: row?.[0] });
    continue;
  }
  
  const primerCol = row[0].trim();
  if (
    primerCol.startsWith('OF=') ||
    primerCol.startsWith('OP=') ||
    primerCol.startsWith('NF=') ||
    primerCol.startsWith('NP=') ||
    primerCol.startsWith('Nota') ||
    primerCol.startsWith('EL PROMEDIO')
  ) {
    breakReason = { fila: i + 1, valor: primerCol };
    saltadas_break = rows.length - i;
    break;
  }

  try {
    const numero_pedido = primerCol;
    const fecha = excelSerialToDate(row[COL.FECHA]);
    const cliente = String(row[COL.CLIENTE] || '').trim();
    const producto = String(row[COL.PRODUCTO] || '').trim();
    const metros = parseFloat(row[COL.METROS_ML]) || 0;
    const desp_kg = parseFloat(row[COL.DESP_KG]) || 0;
    const desp_ml = parseFloat(row[COL.DESP_ML]) || 0;
    const vel_real = parseFloat(row[COL.VEL_REAL]) || null;
    const vel_teorica = parseFloat(row[COL.VEL_TEORICA]) || null;
    const tiempo_parada = Math.round(parseFloat(row[COL.TIEMPO_PARADA])) || 0;
    const desp_pct_kg = parseFloat(row[COL.DESP_PCT_KG]) || null;

    if (!fecha || !cliente || !producto) {
      saltadas_error++;
      skippedRows.push({ fila: i + 1, razon: 'Datos incompletos', pedido: numero_pedido, fecha, cliente, producto });
      continue;
    }

    procesadas++;
    total_metros += metros;
    total_desp_kg += desp_kg;
    total_desp_ml += desp_ml;
    total_paradas_min += tiempo_parada;
    if (vel_real) { total_vel_real += vel_real; vel_count++; }

    processedRows.push({
      fila: i + 1, pedido: numero_pedido, fecha, cliente: cliente.substring(0, 20),
      metros, desp_kg, desp_ml, vel_real, vel_teorica, tiempo_parada, desp_pct_kg
    });
  } catch (err) {
    saltadas_error++;
    skippedRows.push({ fila: i + 1, razon: `Error: ${err.message}` });
  }
}

console.log('\n=== RESULTADOS ===');
console.log(`Filas procesadas exitosamente: ${procesadas}`);
console.log(`Filas saltadas (vacías/col0 vacío): ${saltadas_sin_datos}`);
console.log(`Filas saltadas (break por marcador): ${saltadas_break}`);
console.log(`Filas saltadas (datos incompletos): ${saltadas_error}`);

if (breakReason) {
  console.log(`\n⚠️  BREAK detectado en fila ${breakReason.fila}: "${breakReason.valor}"`);
}

console.log('\n=== TOTALES CALCULADOS DEL EXCEL ===');
console.log(`Total metros producidos: ${total_metros.toFixed(2)}`);
console.log(`Total desperdicio kg: ${total_desp_kg.toFixed(2)}`);
console.log(`Total desperdicio m/l: ${total_desp_ml.toFixed(2)}`);
console.log(`Total paradas (min): ${total_paradas_min}`);
if (vel_count > 0) {
  console.log(`Velocidad real promedio: ${(total_vel_real / vel_count).toFixed(2)} m/min (${vel_count} registros)`);
}

// Desperdicio % calculado
if (total_metros > 0 && total_desp_ml > 0) {
  console.log(`Desperdicio m/l %: ${((total_desp_ml / total_metros) * 100).toFixed(2)}%`);
}

console.log('\n=== FILAS SALTADAS (detalle) ===');
if (skippedRows.length > 0) {
  skippedRows.forEach(s => console.log(`  Fila ${s.fila}: ${s.razon} ${s.pedido ? `(pedido: ${s.pedido})` : ''} ${s.col0 !== undefined ? `[col0: ${JSON.stringify(s.col0)}]` : ''}`));
} else {
  console.log('  Ninguna');
}

// Mostrar filas después del break
if (breakReason) {
  console.log('\n=== FILAS DESPUÉS DEL BREAK (primeras 20) ===');
  for (let i = breakReason.fila - 1; i < Math.min(breakReason.fila + 19, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    const col0 = row[0];
    const fecha = row[COL.FECHA];
    const cliente = row[COL.CLIENTE];
    const metros = row[COL.METROS_ML];
    console.log(`  Fila ${i + 1}: col0="${col0}" fecha=${fecha} cliente="${cliente}" metros=${metros}`);
  }
}

// Verificar si hay filas de datos DESPUÉS del break
if (breakReason) {
  let datosPostBreak = 0;
  for (let i = breakReason.fila; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;
    const col0 = String(row[0]).trim();
    if (col0 === 'PEDIDO') continue;
    const fecha = row[COL.FECHA];
    const cliente = String(row[COL.CLIENTE] || '').trim();
    if (fecha && cliente && !isNaN(fecha)) datosPostBreak++;
  }
  if (datosPostBreak > 0) {
    console.log(`\n🔴 HAY ${datosPostBreak} FILAS DE DATOS DESPUÉS DEL BREAK QUE NO SE IMPORTAN`);
  }
}

// Análisis de columna 0 para detectar patrones inesperados
console.log('\n=== ANÁLISIS DE col[0] - Valores únicos NO numéricos ===');
const uniqueCol0 = new Set();
for (let i = startRow; i < rows.length; i++) {
  const row = rows[i];
  if (!row || !row[0]) continue;
  const v = String(row[0]).trim();
  if (v.match(/^[A-Z]/)) uniqueCol0.add(v.substring(0, 40));
}
uniqueCol0.forEach(v => console.log(`  "${v}"`));

// Tabla de primeros y últimos registros procesados
console.log('\n=== PRIMEROS 5 REGISTROS PROCESADOS ===');
processedRows.slice(0, 5).forEach(r => {
  console.log(`  Fila ${r.fila}: ${r.pedido} | ${r.fecha} | ${r.cliente} | metros=${r.metros} | desp_kg=${r.desp_kg} | vel=${r.vel_real}`);
});

console.log('\n=== ÚLTIMOS 5 REGISTROS PROCESADOS ===');
processedRows.slice(-5).forEach(r => {
  console.log(`  Fila ${r.fila}: ${r.pedido} | ${r.fecha} | ${r.cliente} | metros=${r.metros} | desp_kg=${r.desp_kg} | vel=${r.vel_real}`);
});

// Analizar TODAS las hojas
console.log('\n=== ANÁLISIS DE TODAS LAS HOJAS ===');
for (const sn of wb.SheetNames) {
  const sRows = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: true, defval: null });
  let dataCount = 0;
  for (const r of sRows) {
    if (r && r[0] && typeof r[0] === 'string' && r[0].trim() && r[2] && r[8]) dataCount++;
  }
  console.log(`  Hoja "${sn}": ${sRows.length} filas totales, ~${dataCount} con datos (pedido+fecha+cliente)`);
}

// Verificar si hay datos numéricos en col[0] (en vez de string)
console.log('\n=== FILAS CON col[0] NUMÉRICO (se saltan por typeof !== "string") ===');
let numericCol0Count = 0;
for (let i = startRow; i < rows.length; i++) {
  const row = rows[i];
  if (!row || !row[0]) continue;
  if (typeof row[0] === 'number') {
    numericCol0Count++;
    if (numericCol0Count <= 10) {
      console.log(`  Fila ${i + 1}: col0=${row[0]} (tipo: number) fecha=${row[COL.FECHA]} cliente="${row[COL.CLIENTE]}" metros=${row[COL.METROS_ML]}`);
    }
  }
}
if (numericCol0Count > 10) {
  console.log(`  ... y ${numericCol0Count - 10} más`);
}
console.log(`Total filas con col[0] numérico: ${numericCol0Count}`);
if (numericCol0Count > 0) {
  console.log('\n🔴🔴🔴 ¡¡BUG ENCONTRADO!! El import usa `typeof row[0] !== "string"` como filtro,');
  console.log('    pero hay pedidos con col[0] numérico que se SALTAN silenciosamente.');
}
