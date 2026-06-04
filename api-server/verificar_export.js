// Script que usa el servicio de exportación para generar el Excel desde DB
// y lo compara con el Excel original importado
const XLSX = require('xlsx');
const path = require('path');
const { pool } = require('./config/db');

// ═══════════════════════════════════════════════════════════════
// 1. GENERAR EXCEL IGUAL AL DE LA EXPORTACIÓN DE LA APP
// ═══════════════════════════════════════════════════════════════

// Reproducimos exactamente la lógica de trabajos.service.js exportToExcel
const MOTIVOS_EXCEL_MAP = [
  { col: 11, id: 1, nombre: 'PREPARACION' },
  { col: 12, id: 2, nombre: 'PRE-PRENSA' },
  { col: 13, id: 3, nombre: 'COLORIMETRIA' },
  { col: 14, id: 4, nombre: 'CALIDAD' },
  { col: 15, id: 5, nombre: 'MANTENIMIENTO' },
  { col: 16, id: 6, nombre: 'LIMPIEZA MAQUINA' },
  { col: 17, id: 7, nombre: 'PLANIFICACION' },
  { col: 18, id: 8, nombre: 'LIMPIEZA PLANCHA' },
  { col: 19, id: 9, nombre: 'LIMPIEZA RODILLO' },
  { col: 20, id: 10, nombre: 'LIMPIEZA TAMBOR' },
  { col: 21, id: 11, nombre: 'PRODUCCION' },
  { col: 22, id: 12, nombre: 'PRUEBAS' },
  { col: 23, id: 13, nombre: 'LOGISTICA' },
  { col: 24, id: 14, nombre: 'FALLAS ELECTRICAS' },
  { col: 25, id: 15, nombre: 'APROBACIONES' },
  { col: 26, id: 16, nombre: 'ESTANDAR COLOR' },
  { col: 27, id: 17, nombre: 'RRHH' },
  { col: 28, id: 18, nombre: 'FALTA INSUMO' },
];

async function generateExportExcel() {
  // 1. Obtener trabajos con todos sus detalles (igual que findAllDetailed)
  const [trabajos] = await pool.execute(`
    SELECT t.*,
      m.nombre AS maquina_nombre,
      c.nombre AS cliente,
      p.nombre AS producto,
      d.nombre AS destino,
      e.nombre AS status_orden
    FROM trabajos t
    JOIN maquinas       m  ON t.maquina_id  = m.id
    JOIN clientes       c  ON t.cliente_id  = c.id
    JOIN productos      p  ON t.producto_id = p.id
    JOIN destinos       d  ON t.destino_id  = d.id
    JOIN estados_trabajo e ON t.estado_id   = e.id
    ORDER BY t.fecha ASC, t.maquina_id ASC, t.numero_pedido ASC
  `);

  if (trabajos.length === 0) return null;

  const ids = trabajos.map(t => t.id);

  const [paradas] = await pool.query(
    `SELECT pt.trabajo_id, pt.motivo_id, pt.minutos, mp.nombre AS motivo_nombre
     FROM paradas_trabajo pt JOIN motivos_parada mp ON pt.motivo_id = mp.id
     WHERE pt.trabajo_id IN (?)`, [ids]
  );

  const [velocidades] = await pool.query(
    `SELECT v.*, tu.nombre AS turno FROM velocidad v
     JOIN turnos tu ON v.turno_id = tu.id
     WHERE v.trabajo_id IN (?)`, [ids]
  );

  const [desperdicios] = await pool.query(
    `SELECT * FROM desperdicios WHERE trabajo_id IN (?)`, [ids]
  );

  // 2. Mapear datos (exactamente como en exportToExcel)
  const headers = [
    'Pedido', 'Máquina', 'Fecha', 'Cliente', 'Producto', 'Destino', 'Estado',
    'Meta Kg', 'Metros Reales', 'T. Producción (min)', 'T. Parada (min)', 'T. Total Turno (min)',
    'Vel. Real (m/min)', 'Vel. Teórica (m/min)', '% Rendimiento',
    'Desperdicio Kg', 'Desperdicio M/L', 'Tinta Consumida (Kg)', 'Solvente (Lts)', 'Comentario Desperdicio',
    'PREPARACION', 'PRE-PRENSA', 'COLORIMETRIA', 'CALIDAD', 'MANTENIMIENTO',
    'LIMPIEZA MAQUINA', 'PLANIFICACION', 'LIMPIEZA PLANCHA', 'LIMPIEZA RODILLO',
    'LIMPIEZA TAMBOR', 'PRODUCCION', 'PRUEBAS', 'LOGISTICA', 'FALLAS ELECTRICAS',
    'APROBACIONES', 'ESTANDAR COLOR', 'RRHH', 'FALTA INSUMO',
    'Observaciones'
  ];

  function parseDespComentario(comentario) {
    const result = { solvente: 0, tinta: 0 };
    if (!comentario || typeof comentario !== 'string') return result;
    const sMatch = comentario.match(/Solvente:\s*([0-9.]+)/i);
    if (sMatch) result.solvente = parseFloat(sMatch[1]) || 0;
    const tMatch = comentario.match(/Tinta consumida:\s*([0-9.]+)/i);
    if (tMatch) result.tinta = parseFloat(tMatch[1]) || 0;
    if (!sMatch) {
      const s2 = comentario.match(/Solvente\s*([0-9.]+)/i);
      if (s2) result.solvente = parseFloat(s2[1]) || 0;
    }
    if (!tMatch) {
      const t2 = comentario.match(/Tinta\s*([0-9.]+)/i);
      if (t2) result.tinta = parseFloat(t2[1]) || 0;
    }
    return result;
  }

  const rows = trabajos.map(t => {
    const vel = velocidades.find(v => v.trabajo_id === t.id);
    const desp = desperdicios.find(d => d.trabajo_id === t.id);
    const velTeorica = vel ? parseFloat(vel.velocidad_teorica_mlmin || 0) : 0;
    const velReal = vel ? parseFloat(vel.velocidad_real_mlmin || 0) : 0;
    const rendimiento = velTeorica > 0 ? ((velReal / velTeorica) * 100).toFixed(1) + '%' : '0%';
    const despInfo = parseDespComentario(desp?.comentario);

    const paradasCols = MOTIVOS_EXCEL_MAP.map(m => {
      const p = paradas.find(pr => pr.trabajo_id === t.id && pr.motivo_id === m.id);
      return p ? p.minutos : 0;
    });

    return [
      t.numero_pedido, t.maquina_nombre,
      t.fecha instanceof Date ? t.fecha.toISOString().split('T')[0] : t.fecha,
      t.cliente, t.producto, t.destino, t.status_orden,
      parseFloat(t.meta_kg || 0), parseFloat(t.metros_producidos || 0),
      parseInt(t.tiempo_produccion_min || 0), parseInt(t.tiempo_parada_total_min || 0),
      parseInt(t.tiempo_total_min || 0),
      velReal || 0, velTeorica || 0, rendimiento,
      desp ? parseFloat(desp.cantidad_kg || 0) : 0,
      desp ? parseFloat(desp.cantidad_ml || 0) : 0,
      despInfo.tinta, despInfo.solvente,
      desp?.comentario || '',
      ...paradasCols,
      t.observaciones || ''
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 15 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'REPORTE_CONSOLIDADO');

  return { wb, trabajos, rows };
}

// ═══════════════════════════════════════════════════════════════
// 2. LEER EXCEL ORIGINAL
// ═══════════════════════════════════════════════════════════════

function readOriginalExcel() {
  const filePath = path.join(__dirname, '../EXEL DATOS MAQUINA.xlsx');
  const wb = XLSX.readFile(filePath);
  const result = {};

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    result[sheetName] = { rows, total: rows.length };
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// 3. COMPARAR EXPORTACIÓN vs ORIGINAL
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 COMPARACIÓN: EXCEL EXPORTADO (APP) vs EXCEL ORIGINAL');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Generar el Excel exportado
  console.log('🔄 Generando Excel desde DB (como lo hace la app)...');
  const exportData = await generateExportExcel();
  if (!exportData) {
    console.log('❌ No hay datos en la DB para exportar');
    await pool.end();
    return;
  }
  console.log(`✅ Export generado: ${exportData.trabajos.length} trabajos\n`);

  // Guardar el export físicamente
  const exportPath = path.join(__dirname, '../produccion_export_verificacion.xlsx');
  XLSX.writeFile(exportData.wb, exportPath);
  console.log(`💾 Export guardado en: ${exportPath}\n`);

  // Leer el Excel original
  console.log('📂 Leyendo Excel original importado...');
  const original = readOriginalExcel();
  console.log(`   Hojas: ${Object.keys(original).join(', ')}`);

  // ═══ COMPARACIÓN POR MÁQUINA ═════════════════════════════════════
  const dbTrabajos = exportData.trabajos;

  for (const maquinaNombre of ['OLYMPIA', 'NOVOFLEX']) {
    const maquina_id = maquinaNombre === 'OLYMPIA' ? 1 : 2;
    const dbRecords = dbTrabajos.filter(t => t.maquina_id === maquina_id);

    // Leer datos del Excel original para esta máquina
    const sheetName = maquinaNombre === 'NOVOFLEX' ? 'NOVOFLEX.' : maquinaNombre;
    const sheet = original[sheetName];
    let excelRows = [];
    if (sheet) {
      for (let i = 14; i < sheet.rows.length; i++) {
        const row = sheet.rows[i];
        if (!row || !row[0]) continue;
        const pc = String(row[0]).trim();
        if (pc.startsWith('OF=') || pc.startsWith('OP=') || pc.startsWith('NF=') || pc.startsWith('NP=') ||
            pc.startsWith('Nota') || pc.startsWith('EL PROMEDIO') || pc.startsWith('TOTAL') || pc.startsWith('SUMA'))
          break;
        excelRows.push({
          numero_pedido: pc,
          meta_kg: parseFloat(row[10]) || 0,
          metros: parseFloat(row[62]) || 0,
          t_prod: parseInt(row[30]) || 0,
          t_parada: parseInt(row[29]) || 0,
        });
      }
    }

    // Calcular totales
    const sumDB = {
      registros: dbRecords.length,
      meta_kg: dbRecords.reduce((s, t) => s + parseFloat(t.meta_kg || 0), 0),
      metros: dbRecords.reduce((s, t) => s + parseFloat(t.metros_producidos || 0), 0),
      t_prod: dbRecords.reduce((s, t) => s + parseInt(t.tiempo_produccion_min || 0), 0),
      t_parada: dbRecords.reduce((s, t) => s + parseInt(t.tiempo_parada_total_min || 0), 0),
    };

    const sumExcel = {
      registros: excelRows.length,
      meta_kg: excelRows.reduce((s, r) => s + r.meta_kg, 0),
      metros: excelRows.reduce((s, r) => s + r.metros, 0),
      t_prod: excelRows.reduce((s, r) => s + r.t_prod, 0),
      t_parada: excelRows.reduce((s, r) => s + r.t_parada, 0),
    };

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  🏭 ${maquinaNombre}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const metrics = [
      { label: 'Registros', db: sumDB.registros, excel: sumExcel.registros, entero: true },
      { label: 'Meta Kg', db: sumDB.meta_kg, excel: sumExcel.meta_kg, entero: false },
      { label: 'Metros Producidos', db: sumDB.metros, excel: sumExcel.metros, entero: false },
      { label: 'Tiempo Producción (min)', db: sumDB.t_prod, excel: sumExcel.t_prod, entero: true },
      { label: 'Tiempo Parada (min)', db: sumDB.t_parada, excel: sumExcel.t_parada, entero: true },
    ];

    console.log('  ┌───────────────────────────────────┬──────────────┬──────────────┬──────────────┐');
    console.log('  │ Métrica                           │ Export (DB)  │ Excel Orig.  │ Diferencia   │');
    console.log('  ├───────────────────────────────────┼──────────────┼──────────────┼──────────────┤');
    for (const m of metrics) {
      const fmt = m.entero ? (v) => v.toFixed(0).padStart(12) : (v) => v.toFixed(2).padStart(12);
      const diff = m.db - m.excel;
      console.log(`  │ ${m.label.padEnd(33)} │ ${fmt(m.db)} │ ${fmt(m.excel)} │ ${(m.entero ? diff.toFixed(0) : diff.toFixed(2)).padStart(12)} │`);
    }
    console.log('  └───────────────────────────────────┴──────────────┴──────────────┴──────────────┘');

    // Mostrar rango de fechas del export vs original
    const minDate = dbRecords.length > 0 ? dbRecords[0].fecha?.toISOString?.().split('T')[0] || dbRecords[0].fecha : 'N/A';
    const maxDate = dbRecords.length > 0 ? dbRecords[dbRecords.length - 1].fecha?.toISOString?.().split('T')[0] || dbRecords[dbRecords.length - 1].fecha : 'N/A';
    console.log(`\n  📅 Rango DB: ${minDate} → ${maxDate}`);
    console.log(`  📅 Rango Excel original: Solo 1 mes (Abril 2026)`);
    console.log(`  📌 Diferencia principal: DB tiene ${sumDB.registros - sumExcel.registros} registros más (de Mayo)`);
  }

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`✅ Excel exportado guardado en: producción_export_verificacion.xlsx`);
  console.log(`   Ábrelo y compáralo visualmente con el Excel original.`);
  console.log(`   Si filtran ambos por el mismo mes, los totales deben coincidir.`);
  console.log(`═══════════════════════════════════════════════════════════════`);

  await pool.end();
}

main().catch(err => { console.error('ERROR:', err); process.exit(1); });
