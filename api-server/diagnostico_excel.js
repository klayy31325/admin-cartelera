const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

// ─── Configuración DB ────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  timezone: '+00:00',
  charset: 'utf8mb4',
});

// ─── Columnas del Excel (mismo mapeo que en trabajos.service.js) ────────────
const COL = {
  FECHA:            2,
  DESTINO:          5,
  CLIENTE:          8,
  PRODUCTO:         9,
  META_KG:          10,
  TIEMPO_PARADA:    29,
  TIEMPO_PROD:      30,
  TIEMPO_TOTAL:     31,
  METROS_ML:        62,
  SOLVENTE_LTS:     67,
  TINTA_BLANCO_KG:  69,
  TINTA_VARIAS_KG:  70,
  TINTA_TOTAL_KG:   71,
  VEL_TEORICA:      72,
  VEL_REAL:         73,
  DESP_ML:          74,
  DESP_KG:          78,
  OBSERVACIONES:    82,
  ESTADO:           83,
};

// Motivos de parada: col 11 a 28
const PARADAS_COLS = [
  { col: 11, nombre: 'PREPARACION' },
  { col: 12, nombre: 'PRE-PRENSA' },
  { col: 13, nombre: 'COLORIMETRIA' },
  { col: 14, nombre: 'CALIDAD' },
  { col: 15, nombre: 'MANTENIMIENTO' },
  { col: 16, nombre: 'LIMPIEZA GENERAL DE MAQUINA' },
  { col: 17, nombre: 'PLANIFICACION' },
  { col: 18, nombre: 'LIMPIEZA DE PLANCHA' },
  { col: 19, nombre: 'LIMPIEZA DE RODILLO' },
  { col: 20, nombre: 'LIMPIEZA DE TAMBOR CENTRAL' },
  { col: 21, nombre: 'PRODUCCION' },
  { col: 22, nombre: 'PRUEBAS' },
  { col: 23, nombre: 'LOGISTICA' },
  { col: 24, nombre: 'FALLAS ELECTRICAS' },
  { col: 25, nombre: 'APROBACIONES' },
  { col: 26, nombre: 'ESTANDAR DE COLOR' },
  { col: 27, nombre: 'RRHH' },
  { col: 28, nombre: 'FALTA DE INSUMO / PEDIDO' },
];

const MAQUINAS = { 'OLYMPIA': 1, 'NOVOFLEX': 2 };

function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

function parseNum(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function parseRowData(row, sheetName) {
  const primerCol = String(row[0] || '').trim();
  const fechaExcel = row[COL.FECHA];

  return {
    numero_pedido: primerCol,
    fecha_serial: fechaExcel,
    fecha: excelSerialToDate(fechaExcel),
    meta_kg: parseNum(row[COL.META_KG]),
    tiempo_parada: parseNum(row[COL.TIEMPO_PARADA]),
    tiempo_prod: parseNum(row[COL.TIEMPO_PROD]),
    tiempo_total: parseNum(row[COL.TIEMPO_TOTAL]),
    metros_producidos: parseNum(row[COL.METROS_ML]),
    solvente: parseNum(row[COL.SOLVENTE_LTS]),
    tinta_total: parseNum(row[COL.TINTA_TOTAL_KG]),
    vel_teorica: parseNum(row[COL.VEL_TEORICA]),
    vel_real: parseNum(row[COL.VEL_REAL]),
    desp_ml: parseNum(row[COL.DESP_ML]),
    desp_kg: parseNum(row[COL.DESP_KG]),
    paradas: PARADAS_COLS.map(p => ({ nombre: p.nombre, minutos: parseNum(row[p.col]) })),
    hoja: sheetName,
  };
}

// ─── 1. LEER EXCEL ───────────────────────────────────────────────────────────
function leerExcel() {
  const filePath = path.join(__dirname, '../EXEL DATOS MAQUINA.xlsx');
  const wb = XLSX.readFile(filePath);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📂 Hojas encontradas:', wb.SheetNames.join(', '));
  console.log('═══════════════════════════════════════════════════════════════\n');

  const resultados = {};

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    console.log(`\n🔍 Hoja: "${sheetName}" — Total filas: ${rows.length}`);
    console.log('   Mostrando primeras filas (índices 0-14):');
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      console.log(`   [${i}]:`, rows[i] ? rows[i].slice(0, 10) : '(vacía)');
    }

    // Buscar la fila de totales — suele tener texto como "TOTAL", "Total", "SUMA"
    let totalRowIndex = -1;
    for (let i = 14; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;
      const txt = String(row[0]).trim().toUpperCase();
      if (txt.startsWith('TOTAL') || txt.startsWith('OF=') || txt.startsWith('OP=') || txt.startsWith('SUMA') || txt.startsWith('EL PROMEDIO')) {
        totalRowIndex = i;
        console.log(`   📊 Fila de totales/cierre encontrada en índice ${i}: ${row[0]}`);
        break;
      }
    }

    // Si no encontramos fila de totales, buscar más abajo
    if (totalRowIndex === -1) {
      for (let i = rows.length - 5; i < rows.length; i++) {
        const row = rows[i];
        if (row && row[0]) {
          console.log(`   Fila ${i}:`, row.slice(0, 5));
        }
      }
    }

    // Procesar datos desde fila 14 hasta antes de totales
    const dataRows = [];
    let totalesExcel = null;

    for (let i = 14; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;

      const primerCol = String(row[0]).trim();
      const esTotal = primerCol.toUpperCase().startsWith('TOTAL') ||
                      primerCol.toUpperCase().startsWith('OF=') ||
                      primerCol.toUpperCase().startsWith('OP=') ||
                      primerCol.toUpperCase().startsWith('SUMA') ||
                      primerCol.toUpperCase().startsWith('EL PROMEDIO') ||
                      primerCol.toUpperCase().startsWith('PROMEDIO');

      if (esTotal) {
        totalesExcel = {
          fila: i,
          texto: primerCol,
          meta_kg: parseNum(row[COL.META_KG]),
          tiempo_parada: parseNum(row[COL.TIEMPO_PARADA]),
          tiempo_prod: parseNum(row[COL.TIEMPO_PROD]),
          tiempo_total: parseNum(row[COL.TIEMPO_TOTAL]),
          metros_producidos: parseNum(row[COL.METROS_ML]),
          solvente: parseNum(row[COL.SOLVENTE_LTS]),
          tinta_total: parseNum(row[COL.TINTA_TOTAL_KG]),
          vel_teorica: parseNum(row[COL.VEL_TEORICA]),
          vel_real: parseNum(row[COL.VEL_REAL]),
          desp_ml: parseNum(row[COL.DESP_ML]),
          desp_kg: parseNum(row[COL.DESP_KG]),
          paradas: PARADAS_COLS.map(p => ({ nombre: p.nombre, minutos: parseNum(row[p.col]) })),
        };
        console.log(`   ✅ Fila de TOTALES en índice ${i}: "${primerCol}"`);
        break;
      }

      dataRows.push(parseRowData(row, sheetName));
    }

    // Calcular sumatorias de los datos
    const suma = {
      count: dataRows.length,
      meta_kg: dataRows.reduce((s, r) => s + r.meta_kg, 0),
      tiempo_parada: dataRows.reduce((s, r) => s + r.tiempo_parada, 0),
      tiempo_prod: dataRows.reduce((s, r) => s + r.tiempo_prod, 0),
      tiempo_total: dataRows.reduce((s, r) => s + r.tiempo_total, 0),
      metros_producidos: dataRows.reduce((s, r) => s + r.metros_producidos, 0),
      solvente: dataRows.reduce((s, r) => s + r.solvente, 0),
      tinta_total: dataRows.reduce((s, r) => s + r.tinta_total, 0),
      vel_teorica_prom: dataRows.filter(r => r.vel_teorica > 0).length > 0
        ? dataRows.reduce((s, r) => s + r.vel_teorica, 0) / dataRows.filter(r => r.vel_teorica > 0).length
        : 0,
      vel_real_prom: dataRows.filter(r => r.vel_real > 0).length > 0
        ? dataRows.reduce((s, r) => s + r.vel_real, 0) / dataRows.filter(r => r.vel_real > 0).length
        : 0,
      desp_ml: dataRows.reduce((s, r) => s + r.desp_ml, 0),
      desp_kg: dataRows.reduce((s, r) => s + r.desp_kg, 0),
      paradas: PARADAS_COLS.map(p => ({
        nombre: p.nombre,
        minutos: dataRows.reduce((s, r) => {
          const parada = r.paradas.find(pr => pr.nombre === p.nombre);
          return s + (parada ? parada.minutos : 0);
        }, 0),
      })),
    };

    resultados[sheetName] = {
      dataRows,
      totalesExcel,
      suma,
    };
  }

  return resultados;
}

// ─── 2. CONSULTAR BASE DE DATOS ──────────────────────────────────────────────
async function consultarDB() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🗄️  Consultando Base de Datos...');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const res = {};

  for (const [nombre, maquina_id] of Object.entries(MAQUINAS)) {
    console.log(`\n🔍 Máquina: ${nombre} (id=${maquina_id})`);

    // Trabajos
    const [trabajos] = await pool.execute(
      `SELECT t.*, e.nombre AS status_orden, c.nombre AS cliente_nombre, p.nombre AS producto_nombre
       FROM trabajos t
       JOIN maquinas       m  ON t.maquina_id  = m.id
       JOIN clientes       c  ON t.cliente_id  = c.id
       JOIN productos      p  ON t.producto_id = p.id
       JOIN estados_trabajo e ON t.estado_id   = e.id
       WHERE t.maquina_id = ?
       ORDER BY t.fecha ASC, t.numero_pedido ASC`,
      [maquina_id]
    );

    const trabajoIds = trabajos.map(t => t.id);

    // Paradas
    const [paradas] = trabajoIds.length > 0
      ? await pool.query(
          `SELECT pt.trabajo_id, pt.motivo_id, pt.minutos, mp.nombre AS motivo_nombre
           FROM paradas_trabajo pt
           JOIN motivos_parada mp ON pt.motivo_id = mp.id
           WHERE pt.trabajo_id IN (?)`,
          [trabajoIds]
        )
      : [[], []];

    // Velocidad
    const [velocidades] = trabajoIds.length > 0
      ? await pool.query(
          `SELECT * FROM velocidad WHERE trabajo_id IN (?)`,
          [trabajoIds]
        )
      : [[], []];

    // Desperdicios
    const [desperdicios] = trabajoIds.length > 0
      ? await pool.query(
          `SELECT * FROM desperdicios WHERE trabajo_id IN (?)`,
          [trabajoIds]
        )
      : [[], []];

    // Sumatorias
    const suma = {
      count: trabajos.length,
      meta_kg: trabajos.reduce((s, t) => s + parseFloat(t.meta_kg || 0), 0),
      tiempo_parada: trabajos.reduce((s, t) => s + parseInt(t.tiempo_parada_total_min || 0), 0),
      tiempo_prod: trabajos.reduce((s, t) => s + parseInt(t.tiempo_produccion_min || 0), 0),
      tiempo_total: trabajos.reduce((s, t) => s + parseInt(t.tiempo_total_min || 0), 0),
      metros_producidos: trabajos.reduce((s, t) => s + parseFloat(t.metros_producidos || 0), 0),
    };

    // Velocidad promedio
    const velRegs = velocidades.filter(v => v.velocidad_real_mlmin > 0);
    const velTeoRegs = velocidades.filter(v => v.velocidad_teorica_mlmin > 0);
    suma.vel_real_prom = velRegs.length > 0
      ? velRegs.reduce((s, v) => s + parseFloat(v.velocidad_real_mlmin || 0), 0) / velRegs.length
      : 0;
    suma.vel_teorica_prom = velTeoRegs.length > 0
      ? velTeoRegs.reduce((s, v) => s + parseFloat(v.velocidad_teorica_mlmin || 0), 0) / velTeoRegs.length
      : 0;
    suma.vel_count = velRegs.length;

    // Desperdicios
    suma.desp_ml = desperdicios.reduce((s, d) => s + parseFloat(d.cantidad_ml || 0), 0);
    suma.desp_kg = desperdicios.reduce((s, d) => s + parseFloat(d.cantidad_kg || 0), 0);

    // Solvente y tinta desde comentarios
    let totalSolvente = 0;
    let totalTinta = 0;
    for (const d of desperdicios) {
      const com = d.comentario || '';
      const sMatch = com.match(/Solvente:\s*([0-9.]+)/i);
      if (sMatch) totalSolvente += parseFloat(sMatch[1]) || 0;
      const tMatch = com.match(/Tinta consumida:\s*([0-9.]+)/i);
      if (tMatch) totalTinta += parseFloat(tMatch[1]) || 0;
    }
    suma.solvente = totalSolvente;
    suma.tinta_total = totalTinta;

    // Paradas por motivo
    const paradasSum = PARADAS_COLS.map(p => ({
      nombre: p.nombre,
      minutos: paradas
        .filter(pr => pr.motivo_id === PARADAS_COLS.findIndex(x => x.nombre === p.nombre) + 1)
        .reduce((s, pr) => s + parseInt(pr.minutos || 0), 0),
    }));

    // Corregir: mapear por id correcto
    const motivosDB = [
      { id: 1, nombre: 'PREPARACION' },
      { id: 2, nombre: 'PRE-PRENSA' },
      { id: 3, nombre: 'COLORIMETRIA' },
      { id: 4, nombre: 'CALIDAD' },
      { id: 5, nombre: 'MANTENIMIENTO' },
      { id: 6, nombre: 'LIMPIEZA GENERAL DE MAQUINA' },
      { id: 7, nombre: 'PLANIFICACION' },
      { id: 8, nombre: 'LIMPIEZA DE PLANCHA' },
      { id: 9, nombre: 'LIMPIEZA DE RODILLO' },
      { id: 10, nombre: 'LIMPIEZA DE TAMBOR CENTRAL' },
      { id: 11, nombre: 'PRODUCCION' },
      { id: 12, nombre: 'PRUEBAS' },
      { id: 13, nombre: 'LOGISTICA' },
      { id: 14, nombre: 'FALLAS ELECTRICAS' },
      { id: 15, nombre: 'APROBACIONES' },
      { id: 16, nombre: 'ESTANDAR DE COLOR' },
      { id: 17, nombre: 'RRHH' },
      { id: 18, nombre: 'FALTA DE INSUMO / PEDIDO' },
    ];

    suma.paradas = motivosDB.map(m => ({
      nombre: m.nombre,
      minutos: paradas
        .filter(pr => pr.motivo_id === m.id)
        .reduce((s, pr) => s + parseInt(pr.minutos || 0), 0),
    }));

    res[nombre] = { trabajos, suma };
  }

  return res;
}

// ─── 3. COMPARAR ─────────────────────────────────────────────────────────────
function comparar(excel, db) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 COMPARACIÓN EXCEL vs BASE DE DATOS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const maquina of ['OLYMPIA', 'NOVOFLEX']) {
    const e = excel[maquina];
    const d = db[maquina];

    if (!e || !d) {
      console.log(`⚠️  No hay datos para ${maquina} en alguna de las fuentes\n`);
      continue;
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  🏭 ${maquina}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const metrics = [
      { label: 'Cantidad de registros',        excel: e.suma.count,          db: d.suma.count,          esEntero: true },
      { label: 'Meta Kg (total)',              excel: e.suma.meta_kg,        db: d.suma.meta_kg,        esEntero: false },
      { label: 'Tiempo Parada Total (min)',     excel: e.suma.tiempo_parada,  db: d.suma.tiempo_parada,  esEntero: true },
      { label: 'Tiempo Producción (min)',       excel: e.suma.tiempo_prod,    db: d.suma.tiempo_prod,    esEntero: true },
      { label: 'Tiempo Total (min)',            excel: e.suma.tiempo_total,   db: d.suma.tiempo_total,   esEntero: true },
      { label: 'Metros Producidos (m/l)',       excel: e.suma.metros_producidos, db: d.suma.metros_producidos, esEntero: false },
      { label: 'Velocidad Teórica (promedio)',  excel: e.suma.vel_teorica_prom,  db: d.suma.vel_teorica_prom,  esEntero: false },
      { label: 'Velocidad Real (promedio)',     excel: e.suma.vel_real_prom,     db: d.suma.vel_real_prom,     esEntero: false },
      { label: 'Desperdicio m/l (total)',       excel: e.suma.desp_ml,       db: d.suma.desp_ml,        esEntero: false },
      { label: 'Desperdicio Kg (total)',        excel: e.suma.desp_kg,       db: d.suma.desp_kg,        esEntero: false },
      { label: 'Tinta Total Kg',                excel: e.suma.tinta_total,   db: d.suma.tinta_total,    esEntero: false },
      { label: 'Solvente Lts',                  excel: e.suma.solvente,      db: d.suma.solvente,       esEntero: false },
    ];

    let headerPrinted = false;
    let hayDiferenciasMain = false;

    for (const m of metrics) {
      const diff = m.excel - m.db;
      const tolerancia = m.esEntero ? 1 : 0.05;
      if (Math.abs(diff) <= tolerancia) {
        // Igual o dentro de tolerancia — no mostrar
        continue;
      }
      if (!headerPrinted) {
        console.log('\n  ⚠️  DIFERENCIAS ENCONTRADAS:');
        console.log('  ┌─────────────────────────────────┬──────────────┬──────────────┬──────────────┐');
        console.log('  │ Métrica                         │ Excel        │ Base Datos   │ Diferencia   │');
        console.log('  ├─────────────────────────────────┼──────────────┼──────────────┼──────────────┤');
        headerPrinted = true;
        hayDiferenciasMain = true;
      }
      const excelStr = m.esEntero
        ? m.excel.toFixed(0).padStart(12)
        : m.excel.toFixed(2).padStart(12);
      const dbStr = m.esEntero
        ? m.db.toFixed(0).padStart(12)
        : m.db.toFixed(2).padStart(12);
      const diffStr = (m.esEntero ? diff.toFixed(0) : diff.toFixed(2)).padStart(12);
      console.log(`  │ ${m.label.padEnd(31)} │ ${excelStr} │ ${dbStr} │ ${diffStr} │`);
    }

    if (headerPrinted) {
      console.log('  └─────────────────────────────────┴──────────────┴──────────────┴──────────────┘\n');
    }

    if (!hayDiferenciasMain) {
      console.log('  ✅ TOTALES PRINCIPALES COINCIDEN\n');
    }

    // Comparar totales del Excel (si existen) vs suma de datos
    if (e.totalesExcel) {
      const t = e.totalesExcel;
      console.log(`  📋 Totales según fila "${t.texto}" del Excel:`);
      const tmetrics = [
        { label: 'Meta Kg', excel: t.meta_kg, suma: e.suma.meta_kg, esEntero: false },
        { label: 'T. Parada', excel: t.tiempo_parada, suma: e.suma.tiempo_parada, esEntero: true },
        { label: 'T. Producción', excel: t.tiempo_prod, suma: e.suma.tiempo_prod, esEntero: true },
        { label: 'T. Total', excel: t.tiempo_total, suma: e.suma.tiempo_total, esEntero: true },
        { label: 'Metros (m/l)', excel: t.metros_producidos, suma: e.suma.metros_producidos, esEntero: false },
        { label: 'Desp. m/l', excel: t.desp_ml, suma: e.suma.desp_ml, esEntero: false },
        { label: 'Desp. kg', excel: t.desp_kg, suma: e.suma.desp_kg, esEntero: false },
        { label: 'Tinta Kg', excel: t.tinta_total, suma: e.suma.tinta_total, esEntero: false },
        { label: 'Solvente Lts', excel: t.solvente, suma: e.suma.solvente, esEntero: false },
      ];
      let diffs = false;
      for (const m of tmetrics) {
        const diff = Math.abs(m.excel - m.suma);
        const tol = m.esEntero ? 1 : 0.05;
        if (diff > tol) {
          if (!diffs) {
            console.log('  ⚠️  Discrepancia entre fila de totales y suma de datos en Excel:');
            diffs = true;
          }
          console.log(`    ${m.label}: fila total=${m.excel.toFixed(2)} vs suma datos=${m.suma.toFixed(2)} (diff=${(m.excel - m.suma).toFixed(2)})`);
        }
      }
      if (!diffs) console.log('  ✅ Totales del Excel coinciden con la suma de datos');
    }

    // Comparar paradas
    console.log(`\n  📋 PARADAS POR CATEGORÍA:`);
    let paradasDiff = false;
    for (let i = 0; i < PARADAS_COLS.length; i++) {
      const p = PARADAS_COLS[i];
      const vExcel = e.suma.paradas[i] ? e.suma.paradas[i].minutos : 0;
      const vDB = d.suma.paradas[i] ? d.suma.paradas[i].minutos : 0;
      const diff = Math.abs(vExcel - vDB);
      if (diff > 1) {
        if (!paradasDiff) {
          console.log('  ⚠️  Diferencias en paradas:');
          paradasDiff = true;
        }
        console.log(`    ${p.nombre.padEnd(32)} Excel: ${String(vExcel).padStart(8)} | DB: ${String(vDB).padStart(8)} | Diff: ${(vExcel - vDB).toFixed(0)}`);
      }
    }
    if (!paradasDiff) console.log('  ✅ Todas las paradas coinciden\n');
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  try {
    const excelData = leerExcel();
    const dbData = await consultarDB();
    comparar(excelData, dbData);

    // Mostrar primeras y últimas filas del Excel con problemas potenciales
    for (const [sheetName, data] of Object.entries(excelData)) {
      if (data.dataRows.length > 0) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🔎 Detalle de registros en "${sheetName}" (EXCEL)`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Primeros 5:`);
        for (let i = 0; i < Math.min(5, data.dataRows.length); i++) {
          const r = data.dataRows[i];
          console.log(`  [${i}] Pedido:${r.numero_pedido} Fecha:${r.fecha} Meta:${r.meta_kg} Metros:${r.metros_producidos} T.prod:${r.tiempo_prod} T.parada:${r.tiempo_parada}`);
        }
        console.log(`Últimos 5:`);
        for (let i = Math.max(0, data.dataRows.length - 5); i < data.dataRows.length; i++) {
          const r = data.dataRows[i];
          console.log(`  [${i}] Pedido:${r.numero_pedido} Fecha:${r.fecha} Meta:${r.meta_kg} Metros:${r.metros_producidos} T.prod:${r.tiempo_prod} T.parada:${r.tiempo_parada}`);
        }
        console.log(`Total filas de datos: ${data.dataRows.length}`);
      }
    }

    // Mostrar registros en DB
    for (const [maquina, data] of Object.entries(dbData)) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔎 Detalle de registros en DB para "${maquina}"`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      if (data.trabajos.length > 0) {
        console.log(`Primeros 5:`);
        for (let i = 0; i < Math.min(5, data.trabajos.length); i++) {
          const t = data.trabajos[i];
          console.log(`  [${i}] Pedido:${t.numero_pedido} Fecha:${t.fecha} Meta:${t.meta_kg} Metros:${t.metros_producidos} T.prod:${t.tiempo_produccion_min} T.parada:${t.tiempo_parada_total_min}`);
        }
        console.log(`Últimos 5:`);
        for (let i = Math.max(0, data.trabajos.length - 5); i < data.trabajos.length; i++) {
          const t = data.trabajos[i];
          console.log(`  [${i}] Pedido:${t.numero_pedido} Fecha:${t.fecha} Meta:${t.meta_kg} Metros:${t.metros_producidos} T.prod:${t.tiempo_produccion_min} T.parada:${t.tiempo_parada_total_min}`);
        }
        console.log(`Total registros: ${data.trabajos.length}`);
      } else {
        console.log('  No hay registros');
      }
    }

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

main();
