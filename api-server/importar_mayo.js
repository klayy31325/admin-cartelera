const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

// ─── CONFIG ─────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, port: parseInt(process.env.DB_PORT) || 3306,
  timezone: '+00:00', charset: 'utf8mb4',
});

const COL = {
  FECHA: 2, DESTINO: 5, CLIENTE: 8, PRODUCTO: 9, META_KG: 10,
  TIEMPO_PARADA: 29, TIEMPO_PROD: 30, TIEMPO_TOTAL: 31, METROS_ML: 62,
  SOLVENTE_LTS: 67, TINTA_BLANCO_KG: 69, TINTA_VARIAS_KG: 70, TINTA_TOTAL_KG: 71,
  VEL_TEORICA: 72, VEL_REAL: 73, DESP_ML: 74, DESP_KG: 78,
  OBSERVACIONES: 82, ESTADO: 83,
  PARADA_LIMPIEZA: 16, PARADA_PRUEBAS: 22, PARADA_INSUMO: 28,
  PRODUCCION_KG: 66,
  DESP_PCT_KG: 79,
};

const PARADAS_MAP = [
  { col: 11, id: 1 }, { col: 12, id: 2 }, { col: 13, id: 3 }, { col: 14, id: 4 },
  { col: 15, id: 5 }, { col: 16, id: 6 }, { col: 17, id: 7 }, { col: 18, id: 8 },
  { col: 19, id: 9 }, { col: 20, id: 10 }, { col: 21, id: 11 }, { col: 22, id: 12 },
  { col: 23, id: 13 }, { col: 24, id: 14 }, { col: 25, id: 15 }, { col: 26, id: 16 },
  { col: 27, id: 17 }, { col: 28, id: 18 },
];

const MAQUINA_IDS = { 'OLYMPIA': 1, 'NOVOFLEX': 2 };
const STATUS_VALIDOS = ['PROCESO','REPETICION','APROBACION','SUSPENDIDO','LIMPIEZA','PRUEBA','REPROCESO','FALTA DE INSUMO','PARADA PROGRAMADA'];

function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  return new Date(Math.round((serial - 25569) * 86400 * 1000)).toISOString().split('T')[0];
}
function parseNum(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

// Helpers de catálogo (misma lógica que trabajos.repository.js)
async function getOrCreateCliente(conn, nombre) {
  const n = nombre.trim().toUpperCase();
  const [[found]] = await conn.execute('SELECT id FROM clientes WHERE UPPER(TRIM(nombre)) = ? AND empresa_id = 2', [n]);
  if (found) return found.id;
  const [r] = await conn.execute('INSERT INTO clientes (empresa_id, nombre) VALUES (2, ?)', [nombre.trim()]);
  return r.insertId;
}
async function getOrCreateProducto(conn, nombre, cliente_id) {
  const n = nombre.trim().toUpperCase();
  const [[found]] = await conn.execute('SELECT id FROM productos WHERE UPPER(TRIM(nombre)) = ? AND cliente_id = ?', [n, cliente_id]);
  if (found) return found.id;
  const [r] = await conn.execute('INSERT INTO productos (cliente_id, nombre) VALUES (?, ?)', [cliente_id, nombre.trim()]);
  return r.insertId;
}
async function getDestinoId(conn, nombre) {
  const [[found]] = await conn.execute('SELECT id FROM destinos WHERE UPPER(TRIM(nombre)) = ?', [nombre.trim().toUpperCase()]);
  return found ? found.id : 1;
}
async function getEstadoId(conn, nombre) {
  const [[found]] = await conn.execute('SELECT id FROM estados_trabajo WHERE UPPER(TRIM(nombre)) = ?', [nombre.trim().toUpperCase()]);
  return found ? found.id : 1;
}

async function main() {
  const filePath = path.join(__dirname, '../PRO-2026-05-CX - copia.xlsx');
  const wb = XLSX.readFile(filePath);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔄 INICIANDO IMPORTACIÓN DE MAYO 2026');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ─── PASO 1: Borrar datos de Mayo ──────────────────────────────
  console.log('🗑️  Eliminando datos existentes de Mayo 2026...\n');

  const conn = await pool.getConnection();

  try {
    // Obtener IDs de trabajos de Mayo
    const [mayoTrabajos] = await conn.execute(
      `SELECT id, maquina_id, numero_pedido, fecha, metros_producidos
       FROM trabajos WHERE fecha >= '2026-05-01' AND fecha <= '2026-05-31'
       ORDER BY maquina_id, fecha`
    );

    if (mayoTrabajos.length > 0) {
      const ids = mayoTrabajos.map(t => t.id);

      // Eliminar en orden (SET NULL -> CASCADE)
      const [delDesp] = await conn.query('DELETE FROM desperdicios WHERE trabajo_id IN (?)', [ids]);
      const [delVel] = await conn.query('DELETE FROM velocidad WHERE trabajo_id IN (?)', [ids]);
      const [delPar] = await conn.query('DELETE FROM paradas_trabajo WHERE trabajo_id IN (?)', [ids]);
      const [delTrab] = await conn.query('DELETE FROM trabajos WHERE id IN (?)', [ids]);

      console.log(`   Eliminados:`);
      console.log(`   - ${delTrab.affectedRows} trabajos`);
      console.log(`   - ${delPar.affectedRows} paradas`);
      console.log(`   - ${delVel.affectedRows} velocidad`);
      console.log(`   - ${delDesp.affectedRows} desperdicios`);
    } else {
      console.log('   No hay datos de Mayo para eliminar.');
    }

    await conn.commit();

    // ─── PASO 2: Importar Excel ──────────────────────────────────
    console.log(`\n📥 Importando datos desde PRO-2026-05-CX - copia.xlsx...\n`);

    const resultados = { OLYMPIA: { insertados: 0, errores: 0 }, NOVOFLEX: { insertados: 0, errores: 0 } };

    for (const sheetName of ['OLYMPIA', 'NOVOFLEX.']) {
      const maquinaNombre = sheetName.replace(/\.$/, '');
      const maquina_id = MAQUINA_IDS[maquinaNombre];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

      console.log(`\n━━━ ${maquinaNombre} ━━━`);

      // Detectar fila de inicio de datos: buscar primera fila con pedido válido
      let startRow = 0;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[0]) continue;
        const col0 = String(r[0]).trim();
        // Header de columnas: saltar
        if (col0 === 'PEDIDO' || col0 === 'undefined') continue;
        // Primera fila con dato numérico de fecha en col2 y cliente en col8
        const fecha = r[2];
        const cliente = String(r[8] || '').trim();
        if (fecha && cliente) { startRow = i; break; }
      }
      console.log(`   Inicio datos detectado: fila ${startRow}`);

      // Agrupar registros por (pedido + fecha) para sumar duplicados
      const grouped = {};
      for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[0]) continue;
        const pc = String(row[0]).trim();
        if (pc.startsWith('OF=') || pc.startsWith('NF=') || pc.startsWith('OP=') || pc.startsWith('NP=') ||
            pc.startsWith('Nota') || pc.startsWith('EL PROMEDIO') || pc.startsWith('TOTAL') || pc.startsWith('SUMA'))
          break;
        const fecha = excelSerialToDate(row[COL.FECHA]);
        const cliente = String(row[COL.CLIENTE] || '').trim();
        const producto = String(row[COL.PRODUCTO] || '').trim();
        if (!fecha || !cliente || !producto) continue;
        const key = `${pc}|${fecha}`;
        if (!grouped[key]) {
          grouped[key] = { row, i, pc, fecha, cliente, producto, count: 0, combined: false };
        } else {
          // Sumar valores del duplicado
          const g = grouped[key];
          g.combined = true;
          // Sumar metros
          const newMetros = parseNum(row[COL.METROS_ML]) || 0;
          // Para sumar, necesitamos guardar los acumulados
          if (!g._sumMetros) {
            g._sumMetros = parseNum(g.row[COL.METROS_ML]) || 0;
            g._sumTProd = parseInt(g.row[COL.TIEMPO_PROD]) || 0;
            g._sumTParada = parseInt(g.row[COL.TIEMPO_PARADA]) || 0;
            g._sumTTotal = parseInt(g.row[COL.TIEMPO_TOTAL]) || 0;
            g._sumParadas = PARADAS_MAP.map(p => parseInt(g.row[p.col]) || 0);
            g._sumParLimpieza = parseInt(g.row[COL.PARADA_LIMPIEZA]) || 0;
            g._sumParPruebas = parseInt(g.row[COL.PARADA_PRUEBAS]) || 0;
            g._sumParInsumo = parseInt(g.row[COL.PARADA_INSUMO]) || 0;
            g._sumVelTeo = parseNum(g.row[COL.VEL_TEORICA]) || 0;
            g._sumVelReal = parseNum(g.row[COL.VEL_REAL]) || 0;
            g._sumDespML = parseNum(g.row[COL.DESP_ML]) || 0;
            g._sumDespKG = parseNum(g.row[COL.DESP_KG]) || 0;
            g._sumDespPctKg = parseFloat(g.row[COL.DESP_PCT_KG]) || null;
            g._sumProduccionKg = parseFloat(g.row[COL.PRODUCCION_KG]) || 0;
            g._sumTinta = parseNum(g.row[COL.TINTA_TOTAL_KG]) || 0;
            g._sumSolvente = parseNum(g.row[COL.SOLVENTE_LTS]) || 0;
          }
          g._sumMetros += newMetros;
          g._sumTProd += parseInt(row[COL.TIEMPO_PROD]) || 0;
          g._sumTParada += parseInt(row[COL.TIEMPO_PARADA]) || 0;
          g._sumTTotal += parseInt(row[COL.TIEMPO_TOTAL]) || 0;
          PARADAS_MAP.forEach((p, idx) => { g._sumParadas[idx] += parseInt(row[p.col]) || 0; });
          g._sumParLimpieza += parseInt(row[COL.PARADA_LIMPIEZA]) || 0;
          g._sumParPruebas += parseInt(row[COL.PARADA_PRUEBAS]) || 0;
          g._sumParInsumo += parseInt(row[COL.PARADA_INSUMO]) || 0;
          g._sumVelTeo = Math.max(g._sumVelTeo, parseNum(row[COL.VEL_TEORICA]) || 0);
          g._sumVelReal = g._sumVelReal + (parseNum(row[COL.VEL_REAL]) || 0);
          g._sumDespML += parseNum(row[COL.DESP_ML]) || 0;
          g._sumDespKG += parseNum(row[COL.DESP_KG]) || 0;
          g._sumTinta += parseNum(row[COL.TINTA_TOTAL_KG]) || 0;
          g._sumSolvente += parseNum(row[COL.SOLVENTE_LTS]) || 0;
          g._sumDespPctKg = Math.max(g._sumDespPctKg || 0, parseFloat(row[COL.DESP_PCT_KG]) || 0);
          g._sumProduccionKg += parseFloat(row[COL.PRODUCCION_KG]) || 0;
        }
      }

      const sortedGroups = Object.values(grouped).sort((a, b) => a.i - b.i);
      let count = 0;
      let totalMetros = 0;

      for (const g of sortedGroups) {
        const row = g.combined ? { ...g.row,
          [COL.METROS_ML]: g._sumMetros,
          [COL.TIEMPO_PROD]: g._sumTProd,
          [COL.TIEMPO_PARADA]: g._sumTParada,
          [COL.TIEMPO_TOTAL]: g._sumTTotal,
          [COL.VEL_TEORICA]: g._sumVelTeo,
          [COL.VEL_REAL]: g._sumVelReal,
          [COL.DESP_ML]: g._sumDespML,
          [COL.DESP_KG]: g._sumDespKG,
          [COL.DESP_PCT_KG]: g._sumDespPctKg,
          [COL.PRODUCCION_KG]: g._sumProduccionKg,
          [COL.TINTA_TOTAL_KG]: g._sumTinta,
          [COL.SOLVENTE_LTS]: g._sumSolvente,
          [COL.PARADA_LIMPIEZA]: g._sumParLimpieza,
          [COL.PARADA_PRUEBAS]: g._sumParPruebas,
          [COL.PARADA_INSUMO]: g._sumParInsumo,
        } : g.row;
        // Reconstruir paradas combinadas
        if (g.combined) {
          PARADAS_MAP.forEach((p, idx) => { row[p.col] = g._sumParadas[idx]; });
        }
        const i = g.i;
        const pc = g.pc;
        const fecha = g.fecha;
        const cliente = g.cliente;
        const producto = g.producto;
        const numero_pedido = pc;

        try {
          const destinoRaw = String(row[COL.DESTINO] || 'LAMINACION').trim().toUpperCase();
          const destino = ['LAMINACION','CORTE','TODAS'].includes(destinoRaw) ? destinoRaw : 'LAMINACION';
          const meta_kg = parseNum(row[COL.META_KG]);
          const produccion_kg = parseFloat(row[COL.PRODUCCION_KG]) || null;
          const metros_producidos = parseNum(row[COL.METROS_ML]);
          const tiempo_parada_total_min = parseInt(row[COL.TIEMPO_PARADA]) || 0;
          const tiempo_produccion_min = parseInt(row[COL.TIEMPO_PROD]) || 0;
          const tiempo_total_min = parseInt(row[COL.TIEMPO_TOTAL]) || 0;

          // Estado
          let status_orden = 'PROCESO';
          const estadoCol = String(row[COL.ESTADO] || '').trim().toUpperCase();
          if (STATUS_VALIDOS.includes(estadoCol)) status_orden = estadoCol;
          else {
            for (let c = row.length - 1; c >= row.length - 15 && c >= 0; c--) {
              const v = String(row[c] || '').trim().toUpperCase();
              if (STATUS_VALIDOS.includes(v)) { status_orden = v; break; }
            }
          }

          // Observaciones
          const observaciones = typeof row[COL.OBSERVACIONES] === 'string' && row[COL.OBSERVACIONES].length > 5
            ? row[COL.OBSERVACIONES].trim() : null;

          // Paradas
          const paradasMinutos = PARADAS_MAP.map(m => ({
            motivo_id: m.id,
            minutos: parseInt(row[m.col]) || 0,
          }));

          // Velocidad
          const vel_teorica = parseNum(row[COL.VEL_TEORICA]) || null;
          const vel_real = parseNum(row[COL.VEL_REAL]) || null;

          // Desperdicio
          const desp_ml = parseNum(row[COL.DESP_ML]) || 0;
          const desp_kg = parseNum(row[COL.DESP_KG]) || 0;
          const desp_pct_kg = parseFloat(row[COL.DESP_PCT_KG]) || null;
          const desp_tinta = parseNum(row[COL.TINTA_TOTAL_KG]) || 0;
          const desp_solvente = parseNum(row[COL.SOLVENTE_LTS]) || 0;

          if (!fecha || !cliente || !producto) {
            console.log(`   ⚠️  [${i}] ${pc}: Datos incompletos (fecha/cliente/producto) — saltado`);
            resultados[maquinaNombre].errores++;
            continue;
          }

          // TRANSACCIÓN: Insertar trabajo + paradas + velocidad + desperdicio
          await conn.beginTransaction();

          const cliente_id = await getOrCreateCliente(conn, cliente);
          const producto_id = await getOrCreateProducto(conn, producto, cliente_id);
          const destino_id = await getDestinoId(conn, destino);
          const estado_id = await getEstadoId(conn, status_orden);

          const parada_limpieza_min = parseInt(row[COL.PARADA_LIMPIEZA]) || 0;
          const parada_pruebas_min = parseInt(row[COL.PARADA_PRUEBAS]) || 0;
          const parada_insumo_min = parseInt(row[COL.PARADA_INSUMO]) || 0;

          const [trabajoResult] = await conn.execute(
            `INSERT INTO trabajos
             (maquina_id, cliente_id, producto_id, destino_id, estado_id,
              numero_pedido, fecha, meta_kg, produccion_kg, metros_producidos,
              tiempo_produccion_min, tiempo_parada_total_min, tiempo_total_min,
              parada_limpieza_min, parada_pruebas_min, parada_insumo_min, observaciones)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [maquina_id, cliente_id, producto_id, destino_id, estado_id,
             numero_pedido, fecha, meta_kg, produccion_kg, metros_producidos,
             tiempo_produccion_min, tiempo_parada_total_min, tiempo_total_min,
             parada_limpieza_min, parada_pruebas_min, parada_insumo_min, observaciones]
          );

          const trabajo_id = trabajoResult.insertId;

          // Paradas
          const paradasVals = paradasMinutos.filter(p => p.minutos > 0).map(p => [trabajo_id, p.motivo_id, p.minutos]);
          if (paradasVals.length > 0) {
            await conn.query('INSERT INTO paradas_trabajo (trabajo_id, motivo_id, minutos) VALUES ?', [paradasVals]);
          }

          // Velocidad
          if (vel_teorica || vel_real) {
            const [[turnoRow]] = await conn.execute('SELECT id FROM turnos WHERE UPPER(TRIM(nombre)) = ?', ['A']);
            const turno_id = turnoRow ? turnoRow.id : 1;
            await conn.execute(
              `INSERT INTO velocidad (maquina_id, trabajo_id, turno_id, fecha, velocidad_teorica_mlmin, velocidad_real_mlmin)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [maquina_id, trabajo_id, turno_id, fecha, vel_teorica, vel_real]
            );
          }

          // Desperdicio
          if (desp_kg > 0 || desp_tinta > 0 || desp_solvente > 0 || desp_ml > 0 || desp_pct_kg != null) {
            await conn.execute(
              `INSERT INTO desperdicios (maquina_id, trabajo_id, cantidad_kg, cantidad_ml, porcentaje_kg, comentario, fecha)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [maquina_id, trabajo_id, desp_kg, desp_ml, desp_pct_kg,
               `Film: ${desp_kg} kg | m/l: ${desp_ml} | Tinta consumida: ${desp_tinta} kg | Solvente: ${desp_solvente} lts`,
               fecha]
            );
          }

          await conn.commit();
          count++;
          totalMetros += metros_producidos;
          resultados[maquinaNombre].insertados++;

          if (count <= 5 || count % 10 === 0) {
            process.stdout.write(`   ${String(count).padStart(2)}) ${pc.padEnd(12)} ${fecha} BK:${String(metros_producidos).padStart(8)} ✓\n`);
          }

        } catch (err) {
          await conn.rollback();
          console.log(`   ❌ [${i}] ${pc}: ERROR - ${err.message}`);
          resultados[maquinaNombre].errores++;
        }
      }

      console.log(`\n   ✅ ${maquinaNombre}: ${count} registros importados, ${totalMetros} metros totales`);
    }

    // ─── PASO 3: VERIFICACIÓN ────────────────────────────────────
    console.log(`\n═══════════════════════════════════════════════════════════════`);
    console.log('📊 VERIFICACIÓN POST-IMPORTACIÓN');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const [nombre, mid] of Object.entries(MAQUINA_IDS)) {
      const [dbRows] = await conn.execute(
        `SELECT COUNT(*) as count, COALESCE(SUM(metros_producidos),0) as total
         FROM trabajos WHERE maquina_id = ? AND fecha >= '2026-05-01' AND fecha <= '2026-05-31'`,
        [mid]
      );
      const dbCount = dbRows[0].count;
      const dbMetros = parseFloat(dbRows[0].total);

      // Calcular total esperado del Excel
      const sheetName = nombre === 'NOVOFLEX' ? 'NOVOFLEX.' : nombre;
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      let expectedCount = 0, expectedMetros = 0;
      for (let i = 14; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[0]) continue;
        const pc = String(row[0]).trim();
        if (pc.startsWith('OF=') || pc.startsWith('NF=') || pc.startsWith('OP=') || pc.startsWith('NP=') ||
            pc.startsWith('Nota') || pc.startsWith('EL PROMEDIO')) break;
        expectedCount++;
        expectedMetros += parseNum(row[62]);
      }

      const matchCount = expectedCount === dbCount ? '✅' : '❌';
      const matchMetros = Math.abs(expectedMetros - dbMetros) < 0.5 ? '✅' : '❌';

      console.log(`🏭 ${nombre}:`);
      console.log(`   Registros: Excel=${expectedCount} DB=${dbCount} ${matchCount}`);
      console.log(`   Metros:    Excel=${expectedMetros.toFixed(2)} DB=${dbMetros.toFixed(2)} ${matchMetros}`);
    }

    console.log(`\n✨ Importación completada.`);

  } catch (err) {
    await conn.rollback();
    console.error('ERROR FATAL:', err);
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
