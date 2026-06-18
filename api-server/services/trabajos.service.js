// ============================================================
// services/trabajos.service.js  —  VERSIÓN REFACTORIZADA
// ============================================================
// Cambios principales:
// 1. Mapeo de columnas Excel: PRODUCCION_KG→66, ESTADO_NOVOFLEX→84
// 2. Extracción de ExcelTrabajoParser (SRP, testeable, sin dependencias de DB)
// 3. Transacciones explícitas en create/update (evita datos huérfanos)
// 4. verifyExcel delega 100% en el repositorio (sin pool.query directo)
// 5. Fechas con manejo de zona horaria (evita desfases de día)
// 6. Eliminación de duplicación en mapeo de paradas
// ============================================================

const XLSX = require('xlsx');
const trabajosRepository = require('../repositories/trabajos.repository');
const resumenExcelRepository = require('../repositories/resumen_excel.repository');
const totalesParadasRepository = require('../repositories/totales_paradas.repository');
const metasParadaRepository = require('../repositories/metas_parada.repository');
const logsRepository = require('../repositories/logs.repository');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../utils/constants');
const { MOTIVOS_EXCEL_MAP } = require('../repositories/trabajos.repository');
const { pool } = require('../config/db');

// ── Constantes de mapeo de columnas (CORREGIDAS) ────────────────────────────
const COL = {
  FECHA: 2,
  DESTINO: 5,
  CLIENTE: 8,
  PRODUCTO: 9,
  META_KG: 10,
  TIEMPO_PARADA: 29,
  TIEMPO_PROD: 30,
  TIEMPO_TOTAL: 31,
  METROS_ML: 62,
  // SOLVENTE_LTS: no usado en este formato
  TINTA_BLANCO_KG: 69,
  TINTA_VARIAS_KG: 70,
  TINTA_TOTAL_KG: 71,
  VEL_TEORICA: 72,
  VEL_REAL: 73,
  DESP_ML: 74,
  DESP_KG: 78,
  OBSERVACIONES: 82,
  ESTADO: 83,              // OLYMPIA: correcto
  ESTADO_NOVOFLEX: 84,     // ← NUEVO: NOVOFLEX tiene +1 columna de offset
  PARADA_LIMPIEZA: 16,
  PARADA_PRUEBAS: 22,
  PARADA_INSUMO: 28,
  PRODUCCION_KG: 66,       // col 66 = Kg reales (NO col 67 que siempre es 0)
  DESP_PCT_KG: 79,
  DESP_PCT_ML: 77,
};

const MAQUINA_IDS = { OLYMPIA: 1, NOVOFLEX: 2 };

const STATUS_VALIDOS = [
  'PROCESO', 'REPETICION', 'APROBACION', 'SUSPENDIDO', 'LIMPIEZA',
  'PRUEBA', 'REPROCESO', 'FALTA DE INSUMO', 'PARADA PROGRAMADA',
];

// ── Utilidades de fecha (con zona horaria local) ───────────────────────────
function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  // Excel serial usa epoch 1899-12-30 (Windows) o 1904 (Mac). Asumimos Windows (25569).
  // Usamos UTC para evitar desfases de zona horaria, luego formateamos YYYY-MM-DD.
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const date = new Date(utcValue * 1000);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Parsea solvente y tinta desde el comentario serializado de desperdicios
function parseDesperdicioComentario(comentario) {
  const result = { solvente: 0, tinta: 0 };
  if (!comentario || typeof comentario !== 'string') return result;

  const solventMatch = comentario.match(/Solvente[:\s]+([0-9.]+)/i);
  if (solventMatch) result.solvente = parseFloat(solventMatch[1]) || 0;

  const tintaMatch = comentario.match(/Tinta(?:\s+consumida)?[:\s]+([0-9.]+)/i);
  if (tintaMatch) result.tinta = parseFloat(tintaMatch[1]) || 0;

  return result;
}

// ── ExcelTrabajoParser: encapsula TODA la lógica de lectura de Excel ─────────
class ExcelTrabajoParser {
  constructor(maquinaNombre) {
    this.maquinaNombre = maquinaNombre?.toUpperCase();
    this.maquina_id = MAQUINA_IDS[this.maquinaNombre];
    if (!this.maquina_id) {
      throw new AppError('Máquina inválida. Use OLYMPIA o NOVOFLEX.', HTTP_STATUS.BAD_REQUEST);
    }
  }

  readWorkbook(buffer) {
    const wb = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: false,
      cellNF: false,
      cellText: false,
    });

    const sheetName = wb.SheetNames.find(n =>
      n.toUpperCase().replace(/\./g, '').trim() === this.maquinaNombre
    );
    if (!sheetName) {
      throw new AppError(`Hoja "${this.maquinaNombre}" no encontrada en el Excel.`, HTTP_STATUS.BAD_REQUEST);
    }

    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
      header: 1,
      raw: true,
      defval: null,
    });

    return rows;
  }

  detectStartRow(rows) {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;
      const col0 = String(r[0]).trim();
      if (col0 === 'PEDIDO' || col0 === 'undefined') continue;
      const fecha = r[2];
      const cliente = String(r[8] || '').trim();
      if (fecha && cliente) return i;
    }
    return 0;
  }

  detectParadasSwap(rows, startRow) {
    const paradasMap = MOTIVOS_EXCEL_MAP.map(m => ({ ...m }));
    for (let i = startRow - 1; i >= 0; i--) {
      const r = rows[i];
      if (r && r[11] && String(r[11]).trim() === 'PREPARACION') {
        const col19 = String(r[19] || '').trim().toUpperCase();
        if (col19.includes('TAMBOR')) {
          const m19 = paradasMap.find(m => m.col === 19);
          const m20 = paradasMap.find(m => m.col === 20);
          if (m19 && m20) [m19.id, m20.id] = [m20.id, m19.id];
        }
        break;
      }
    }
    return paradasMap;
  }

  isEndOfData(row) {
    if (!row || !row[0]) return true;
    const primerCol = String(row[0]).trim();
    const terminadores = [
      'OF=', 'OP=', 'NF=', 'NP=',
      'Nota', 'EL PROMEDIO', 'TOTAL', 'SUMA',
    ];
    return terminadores.some(t => primerCol.startsWith(t));
  }

  /**
   * Lee la fila de resumen (NF= / OF=) y extrae los totales pre-calculados del Excel.
   * @param {Array} rows - Todas las filas del Excel (sheet_to_json header:1)
   * @returns {Object|null} - Totales encontrados o null
   */
  readSummaryTotals(rows) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const marker = String(row[0] || '').trim().toUpperCase();
      if (!marker.startsWith('NF=') && !marker.startsWith('OF=')) continue;

      const total_trabajos = parseInt(row[6]) || 0;

      const rawPctKg = parseFloat(row[COL.DESP_PCT_KG]);
      const rawPctMl = parseFloat(row[COL.DESP_PCT_ML]);

      // Build 18 parada columns (Excel cols 11-28)
      const paradas = {};
      for (let c = 0; c < 18; c++) {
        const idx = c + 11;
        const val = Math.round(parseFloat(row[idx])) || 0;
        paradas[c + 1] = val;
      }

      // Read META row (one row after NF=/OF=, where col 10 = "meta")
      const metas_parada = [];
      if (i + 1 < rows.length) {
        const metaRow = rows[i + 1];
        const metaLabel = String(metaRow[10] || '').trim().toLowerCase();
        if (metaLabel === 'meta') {
          for (let c = 0; c < 18; c++) {
            const idx = c + 11;
            const rawVal = parseFloat(metaRow[idx]);
            const pctVal = rawVal != null ? Math.round(rawVal * 10000) / 100 : 0;
            metas_parada.push({ motivo_id: c + 1, valor_limite: pctVal });
          }
        }
      }

      return {
        meta_kg: parseFloat(row[COL.META_KG]) || 0,
        metros_ml: parseFloat(row[COL.METROS_ML]) || 0,
        produccion_kg: parseFloat(row[COL.PRODUCCION_KG]) || 0,
        tiempo_prod_min: Math.round(parseFloat(row[COL.TIEMPO_PROD])) || 0,
        tiempo_parada_min: Math.round(parseFloat(row[COL.TIEMPO_PARADA])) || 0,
        tiempo_total_min: Math.round(parseFloat(row[COL.TIEMPO_TOTAL])) || 0,
        desperdicio_ml: parseFloat(row[COL.DESP_ML]) || 0,
        desperdicio_kg: parseFloat(row[COL.DESP_KG]) || 0,
        desperdicio_pct_kg: rawPctKg != null ? Math.round(rawPctKg * 10000) / 100 : null,
        desperdicio_pct_ml: rawPctMl != null ? Math.round(rawPctMl * 10000) / 100 : null,
        tinta_blanco_kg: parseFloat(row[COL.TINTA_BLANCO_KG]) || 0,
        tinta_varias_kg: parseFloat(row[COL.TINTA_VARIAS_KG]) || 0,
        tinta_total_kg: parseFloat(row[COL.TINTA_TOTAL_KG]) || 0,
        total_trabajos,
        paradas,
        vel_real_avg: parseFloat(row[COL.VEL_REAL]) || 0,
        vel_teorica_avg: parseFloat(row[COL.VEL_TEORICA]) || 0,
        metas_parada,
      };
    }
    return null;
  }

  parseRow(row, paradasMap) {
    const numero_pedido = String(row[0]).trim();
    const fecha = excelSerialToDate(row[COL.FECHA]);
    const cliente = String(row[COL.CLIENTE] || '').trim();
    const producto = String(row[COL.PRODUCTO] || '').trim();

    const destino_raw = String(row[COL.DESTINO] || 'LAMINACION').trim().toUpperCase();
    const destino = ['LAMINACION', 'CORTE', 'TODAS'].includes(destino_raw) ? destino_raw : 'LAMINACION';

    const meta_kg = parseFloat(row[COL.META_KG]) || 0;
    const produccion_kg = parseFloat(row[COL.PRODUCCION_KG]) || null;

    const tiempo_parada_total_min = Math.round(parseFloat(row[COL.TIEMPO_PARADA])) || 0;
    const tiempo_produccion_min = Math.round(parseFloat(row[COL.TIEMPO_PROD])) || 0;
    const tiempo_total_min = Math.round(parseFloat(row[COL.TIEMPO_TOTAL])) || 0;
    const metros_producidos = parseFloat(row[COL.METROS_ML]) || 0;
    const parada_limpieza_min = Math.round(parseFloat(row[COL.PARADA_LIMPIEZA])) || 0;
    const parada_pruebas_min = Math.round(parseFloat(row[COL.PARADA_PRUEBAS])) || 0;
    const parada_insumo_min = Math.round(parseFloat(row[COL.PARADA_INSUMO])) || 0;

    // Estado: índice depende de la máquina
    const estadoIdx = this.maquina_id === 2 ? COL.ESTADO_NOVOFLEX : COL.ESTADO;
    let status_orden = 'PROCESO';
    const estadoCol = String(row[estadoIdx] || '').trim().toUpperCase();
    if (STATUS_VALIDOS.includes(estadoCol)) {
      status_orden = estadoCol;
    } else {
      // Fallback heurístico solo si el valor directo no sirvió
      for (let c = row.length - 1; c >= row.length - 15 && c >= 0; c--) {
        const v = String(row[c] || '').trim().toUpperCase();
        if (STATUS_VALIDOS.includes(v)) { status_orden = v; break; }
      }
    }

    const observaciones = typeof row[COL.OBSERVACIONES] === 'string' && row[COL.OBSERVACIONES].length > 5
      ? row[COL.OBSERVACIONES].trim()
      : null;

    // Paradas por categoría
    const paradasMinutos = paradasMap.map(m => ({
      motivo_id: m.id,
      minutos: Math.round(parseFloat(row[m.col])) || 0,
    }));

    // Velocidad
    const vel_teorica = parseFloat(row[COL.VEL_TEORICA]) || null;
    const vel_real = parseFloat(row[COL.VEL_REAL]) || null;

    // Desperdicio
    const desp_ml = parseFloat(row[COL.DESP_ML]) || 0;
    const desp_kg = parseFloat(row[COL.DESP_KG]) || 0;
    const desp_tinta = parseFloat(row[COL.TINTA_TOTAL_KG]) || 0;
    const desp_pct_kg = parseFloat(row[COL.DESP_PCT_KG]) || null;

    const velocidadData = (vel_teorica || vel_real) ? { teorica: vel_teorica, real: vel_real } : null;
    const desperdicioData = (desp_kg > 0 || desp_tinta > 0 || desp_ml > 0 || desp_pct_kg != null)
      ? { kg_film: desp_kg, ml_film: desp_ml, tinta_kg: desp_tinta, porcentaje_kg: desp_pct_kg }
      : null;

    const trabajoData = {
      maquina_id: this.maquina_id,
      numero_pedido,
      fecha,
      cliente,
      producto,
      destino,
      meta_kg,
      produccion_kg,
      metros_producidos,
      tiempo_produccion_min,
      tiempo_parada_total_min,
      tiempo_total_min,
      parada_limpieza_min,
      parada_pruebas_min,
      parada_insumo_min,
      status_orden,
      observaciones,
    };

    // Sanitizar undefined → null
    for (const key of Object.keys(trabajoData)) {
      if (trabajoData[key] === undefined) trabajoData[key] = null;
    }

    return {
      trabajoData,
      paradasMinutos,
      velocidadData,
      desperdicioData,
      vel_teorica,
      vel_real,
      desp_kg,
      desp_ml,
      desp_tinta,
    };
  }
}

// ── TrabajosService: orquesta repositorios, transacciones y logs ─────────────
class TrabajosService {
  async getAll(filters) {
    return await trabajosRepository.findAll(filters);
  }

  async getById(id) {
    const trabajo = await trabajosRepository.findById(id);
    if (!trabajo) throw new AppError('Trabajo no encontrado.', HTTP_STATUS.NOT_FOUND);
    return trabajo;
  }

  async create(data, usuario_id = null) {
    this._validate(data);
    if (data.tiempo_total_min === undefined || data.tiempo_total_min === null) {
      data.tiempo_total_min = (data.tiempo_produccion_min || 0) + (data.tiempo_parada_total_min || 0);
    }
    const paradasMinutos = this._extractParadas(data);
    const velocidadData = data.velocidad || null;
    const desperdicioData = data.desperdicio || null;

    // ── Transacción explícita ──
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      const trabajo = await trabajosRepository.create(data, paradasMinutos, velocidadData, desperdicioData, { connection });
      await connection.commit();

      // Log (no crítico, no falla la operación)
      await this._logAction('CREATE_JOB', data, velocidadData, desperdicioData, usuario_id);
      return trabajo;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async update(id, data, usuario_id = null) {
    this._validate(data);
    if (data.tiempo_total_min === undefined || data.tiempo_total_min === null) {
      data.tiempo_total_min = (data.tiempo_produccion_min || 0) + (data.tiempo_parada_total_min || 0);
    }
    const paradasMinutos = this._extractParadas(data);
    const velocidadData = data.velocidad || null;
    const desperdicioData = data.desperdicio || null;

    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      const result = await trabajosRepository.update(id, data, paradasMinutos, velocidadData, desperdicioData, { connection });
      await connection.commit();

      await this._logAction('UPDATE_JOB', data, velocidadData, desperdicioData, usuario_id);
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async delete(id) {
    const result = await trabajosRepository.delete(id);
    if (result.affectedRows === 0) throw new AppError('Trabajo no encontrado.', HTTP_STATUS.NOT_FOUND);
    return { message: 'Trabajo eliminado.' };
  }

  /**
   * Importar desde archivo Excel — extrae trabajos, paradas, velocidad y desperdicio
   * @param {Buffer} buffer      - Contenido del archivo .xlsx
   * @param {string} maquinaNombre - 'OLYMPIA' o 'NOVOFLEX'
   * @param {boolean} preview    - Si true, retorna los datos sin guardar
   */
  async importFromExcel(buffer, maquinaNombre, preview = false) {
    const parser = new ExcelTrabajoParser(maquinaNombre);
    const rows = parser.readWorkbook(buffer);
    const startRow = parser.detectStartRow(rows);
    const paradasMap = parser.detectParadasSwap(rows, startRow);

    const resultados = {
      insertados: 0,
      actualizados: 0,
      duplicados: 0,
      errores: [],
      velocidad_insertada: 0,
      desperdicio_insertado: 0,
      preview: [],
    };

    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      if (parser.isEndOfData(row)) break;

      try {
        const parsed = parser.parseRow(row, paradasMap);
        const { trabajoData, paradasMinutos, velocidadData, desperdicioData } = parsed;

        // Validación mínima
        if (!trabajoData.fecha || !trabajoData.cliente || !trabajoData.producto) {
          resultados.errores.push({ fila: i + 1, razon: 'Datos incompletos (fecha/cliente/producto)' });
          continue;
        }

        // ── Modo Preview ──
        if (preview) {
          resultados.preview.push({
            ...trabajoData,
            paradas: paradasMinutos.filter(p => p.minutos > 0),
            velocidad: { teorica: parsed.vel_teorica, real: parsed.vel_real },
            desperdicio: {
              kg_film: parsed.desp_kg,
              ml_film: parsed.desp_ml,
              tinta_kg: parsed.desp_tinta,
            },
          });
          continue;
        }

        // ── Verificar duplicado → Actualizar o Insertar ──
        const existente = await trabajosRepository.existsByPedidoMaquinaFecha(
          trabajoData.numero_pedido,
          trabajoData.maquina_id,
          trabajoData.fecha
        );

        if (existente) {
          const connection = await pool.getConnection();
          await connection.beginTransaction();
          try {
            await trabajosRepository.update(existente.id, trabajoData, paradasMinutos, velocidadData, desperdicioData, { connection });
            await connection.commit();
            resultados.actualizados++;
          } catch (err) {
            await connection.rollback();
            throw err;
          } finally {
            connection.release();
          }
          continue;
        }

        // ── Insertar nuevo con transacción ──
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        try {
          await trabajosRepository.create(trabajoData, paradasMinutos, velocidadData, desperdicioData, { connection });
          await connection.commit();
          resultados.insertados++;
          if (velocidadData) resultados.velocidad_insertada++;
          if (desperdicioData) resultados.desperdicio_insertado++;
        } catch (err) {
          await connection.rollback();
          throw err;
        } finally {
          connection.release();
        }

      } catch (err) {
        resultados.errores.push({ fila: i + 1, razon: err.message });
      }
    }

    // ── Guardar totales del resumen Excel ──
    try {
      const summary = parser.readSummaryTotals(rows);
      if (summary) {
        // Detectar mes desde los datos
        let mes = null;
        for (let i = startRow; i < rows.length; i++) {
          if (parser.isEndOfData(rows[i])) break;
          const f = excelSerialToDate(rows[i][COL.FECHA]);
          if (f) { mes = f.slice(0, 7); break; }
        }
        if (!mes) mes = new Date().toISOString().slice(0, 7);
        await resumenExcelRepository.upsert(parser.maquina_id, mes, summary);
        if (summary.paradas) {
          await totalesParadasRepository.upsertMany(parser.maquina_id, mes, summary.paradas);
        }
        if (summary.metas_parada && summary.metas_parada.length > 0) {
          await metasParadaRepository.upsertMany(parser.maquina_id, mes, summary.metas_parada);
        }
        resultados.totales_excel = summary;
      }
    } catch (summaryErr) {
      console.error('[Import] Error guardando totales del Excel:', summaryErr.message);
    }

    // ── Log de importación ──
    await this._logImport(resultados, maquinaNombre);
    return resultados;
  }

  /**
   * Importar SOLO los totales del resumen (NF= / OF=) desde el Excel.
   * No modifica la tabla trabajos — solo guarda en resumen_excel.
   */
  async importTotales(buffer, maquinaNombre, preview = false) {
    const parser = new ExcelTrabajoParser(maquinaNombre);
    const rows = parser.readWorkbook(buffer);
    const summary = parser.readSummaryTotals(rows);

    if (!summary) {
      throw new AppError(
        `No se encontró fila de resumen (${maquinaNombre === 'NOVOFLEX' ? 'NF' : 'OF'}=) en el Excel.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Determinar mes desde la primera fila con fecha
    const startRow = parser.detectStartRow(rows);
    let mes = null;
    for (let i = startRow; i < rows.length; i++) {
      if (parser.isEndOfData(rows[i])) break;
      const f = excelSerialToDate(rows[i][COL.FECHA]);
      if (f) { mes = f.slice(0, 7); break; }
    }
    if (!mes) mes = new Date().toISOString().slice(0, 7);

    if (preview) {
      return { preview: { maquina: maquinaNombre, mes, ...summary } };
    }

    await resumenExcelRepository.upsert(parser.maquina_id, mes, summary);

    if (summary.paradas) {
      await totalesParadasRepository.upsertMany(parser.maquina_id, mes, summary.paradas);
    }

    if (summary.metas_parada && summary.metas_parada.length > 0) {
      await metasParadaRepository.upsertMany(parser.maquina_id, mes, summary.metas_parada);
    }

    await logsRepository.create({
      usuario_id: null,
      accion: 'IMPORT_TOTALS',
      descripcion: `[IMPORTACIÓN TOTALES] Resumen de ${maquinaNombre} para ${mes} guardado. Total trabajos: ${summary.total_trabajos}`,
      tipo: 'success',
    });

    return { importado: true, maquina: maquinaNombre, mes, total_trabajos: summary.total_trabajos };
  }

  /**
   * Guardar totales mensuales manualmente (carga manual de totales).
   * También guarda metas_parada si se proporcionan (opcional).
   */
  async saveTotales(data, usuario_id = null) {
    if (!data.maquina_id) throw new AppError('La máquina es obligatoria.', HTTP_STATUS.BAD_REQUEST);

    // Fallback: si mes viene vacío, usar el mes actual
    let mes = data.mes;
    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      mes = new Date().toISOString().slice(0, 7);
    }

    const payload = {
      meta_kg: data.meta_kg || 0,
      metros_ml: data.metros_ml || 0,
      produccion_kg: data.produccion_kg || 0,
      tiempo_prod_min: data.tiempo_prod_min || 0,
      tiempo_parada_min: data.tiempo_parada_min || 0,
      tiempo_total_min: data.tiempo_total_min != null ? data.tiempo_total_min : (data.tiempo_prod_min || 0) + (data.tiempo_parada_min || 0),
      desperdicio_ml: data.desperdicio_ml || 0,
      desperdicio_kg: data.desperdicio_kg || 0,
      desperdicio_pct_kg: data.desperdicio_pct_kg ?? null,
      desperdicio_pct_ml: data.desperdicio_pct_ml ?? null,
      total_trabajos: data.total_trabajos || 0,
      tinta_blanco_kg: data.tinta_blanco_kg || 0,
      tinta_varias_kg: data.tinta_varias_kg || 0,
      tinta_total_kg: data.tinta_total_kg || 0,
      vel_real_avg: data.vel_real_avg || 0,
      vel_teorica_avg: data.vel_teorica_avg || 0,
    };

    await resumenExcelRepository.upsert(data.maquina_id, mes, payload);

    // Guardar paradas en tabla normalizada
    if (data.paradas) {
      await totalesParadasRepository.upsertMany(data.maquina_id, mes, data.paradas);
    }

    // Metas de parada: solo si se enviaron explícitamente
    if (data.metas_parada && Array.isArray(data.metas_parada) && data.metas_parada.length > 0) {
      await metasParadaRepository.upsertMany(data.maquina_id, mes, data.metas_parada);
    }

    const maquinaNombre = data.maquina_id === 1 ? 'OLYMPIA' : 'NOVOFLEX';
    await logsRepository.create({
      usuario_id,
      accion: 'SAVE_TOTALS',
      descripcion: `[CARGA MANUAL TOTALES] Totales de ${maquinaNombre} para ${mes} guardados. Total trabajos: ${payload.total_trabajos}`,
      tipo: 'success',
    });

    return { maquina_id: data.maquina_id, mes };
  }

  /**
   * Obtener resumen_excel para una máquina y mes
   */
  async getResumenTotales(maquina_id, mes) {
    const mId = maquina_id ? Number(maquina_id) : null;
    const targetMes = mes || new Date().toISOString().slice(0, 7);

    if (mId) {
      const resumen = await resumenExcelRepository.findByMaquinaYMes(mId, targetMes);
      const paradas = await totalesParadasRepository.findByMaquinaYMes(mId, targetMes);
      if (resumen) resumen.paradas = paradas;
      return resumen;
    }

    const resumenes = await resumenExcelRepository.findUltimos(2);
    if (resumenes.length > 0) {
      const meses = [...new Set(resumenes.map(r => r.mes))];
      const todasParadas = await totalesParadasRepository.findByMes(meses[0]);
      const paradasPorMaquina = {};
      for (const p of todasParadas) {
        if (!paradasPorMaquina[p.maquina_id]) paradasPorMaquina[p.maquina_id] = [];
        paradasPorMaquina[p.maquina_id].push(p);
      }
      for (const r of resumenes) {
        r.paradas = paradasPorMaquina[r.maquina_id] || [];
      }
    }
    return resumenes;
  }
  /**
   * Exportar Excel con resumen mensual y totales paradas
   */
  async exportResumenExcel(filters) {
    const { maquina_id, fecha_inicio, fecha_fin } = filters;

    const hoy = new Date();
    const mesActual = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0');
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const defaultInicio = mesActual + '-01';
    const defaultFin = mesActual + '-' + String(ultimoDia).padStart(2, '0');

    const fInicio = fecha_inicio || defaultInicio;
    const fFin = fecha_fin || defaultFin;

    const maquinaIds = maquina_id ? [Number(maquina_id)] : [1, 2];
    const mapaMaquinas = { 1: 'OLYMPIA', 2: 'NOVOFLEX' };

    const startDate = new Date(fInicio + 'T00:00:00');
    const endDate = new Date(fFin + 'T00:00:00');
    const months = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (current <= endDate) {
      months.push(current.getFullYear() + '-' + String(current.getMonth() + 1).padStart(2, '0'));
      current.setMonth(current.getMonth() + 1);
    }

    const motivosLookup = {};
    for (const m of MOTIVOS_EXCEL_MAP) {
      motivosLookup[m.id] = m.nombre || 'MOTIVO_' + m.id;
    }

    // ── 1. Obtener datos de resumen_excel (pre-cargados por importación) ──
    const resumenFromDb = {};  // key: "maquinaId:mes"
    const paradasFromDb = {};  // key: "maquinaId:mes" → array

    for (const mId of maquinaIds) {
      const resumenes = await resumenExcelRepository.findByMonths(mId, months);
      for (const r of resumenes) {
        resumenFromDb[mId + ':' + r.mes] = r;
      }
      const paradas = await totalesParadasRepository.findByMaquinaYMonths(mId, months);
      for (const p of paradas) {
        const key = mId + ':' + p.mes;
        if (!paradasFromDb[key]) paradasFromDb[key] = [];
        paradasFromDb[key].push(p);
      }
    }

    // ── 2. Fallback: agregar desde trabajos si no hay resumen_excel ──
    if (Object.keys(resumenFromDb).length === 0) {
      const aggregated = await trabajosRepository.getResumenAggregated(
        maquinaIds.length === 1 ? maquinaIds[0] : null,
        months
      );
      for (const a of aggregated) {
        resumenFromDb[a.maquina_id + ':' + a.mes] = a;
      }
    }

    if (Object.keys(paradasFromDb).length === 0) {
      const aggregatedParadas = await trabajosRepository.getParadasAggregated(
        maquinaIds.length === 1 ? maquinaIds[0] : null,
        months
      );
      for (const p of aggregatedParadas) {
        const key = p.maquina_id + ':' + p.mes;
        if (!paradasFromDb[key]) paradasFromDb[key] = [];
        paradasFromDb[key].push(p);
      }
    }

    // ── 3. Construir filas del Excel ──
    const resumenRows = [];
    const paradasRows = [];

    for (const mId of maquinaIds) {
      for (const mes of months) {
        const r = resumenFromDb[mId + ':' + mes];
        if (!r) continue;
        resumenRows.push([
          mapaMaquinas[mId] || 'MAQUINA ' + mId,
          mes,
          r.meta_kg ?? 0,
          r.produccion_kg ?? 0,
          r.metros_ml ?? 0,
          r.tiempo_prod_min ?? 0,
          r.tiempo_parada_min ?? 0,
          r.tiempo_total_min ?? 0,
          r.desperdicio_kg ?? 0,
          r.desperdicio_ml ?? 0,
          r.desperdicio_pct_kg ?? null,
          r.desperdicio_pct_ml ?? null,
          r.total_trabajos ?? 0,
          r.tinta_blanco_kg ?? 0,
          r.tinta_varias_kg ?? 0,
          r.tinta_total_kg ?? 0,
          r.vel_real_avg ?? 0,
          r.vel_teorica_avg ?? 0,
        ]);
      }

      for (const mes of months) {
        const paradas = paradasFromDb[mId + ':' + mes] || [];
        for (const p of paradas) {
          paradasRows.push([
            mapaMaquinas[mId] || 'MAQUINA ' + mId,
            mes,
            p.motivo_nombre || motivosLookup[p.motivo_id] || 'MOTIVO_' + p.motivo_id,
            p.total_minutos ?? 0,
          ]);
        }
      }
    }

    const maquinaLabel = maquina_id
      ? (mapaMaquinas[Number(maquina_id)] || 'MAQUINA ' + maquina_id)
      : 'TODAS LAS MAQUINAS';

    const titleRow = ['REPORTE DE PRODUCCION - RESUMEN MENSUAL'];
    const periodRow = ['Periodo: ' + fInicio + ' a ' + fFin];
    const machineRow = ['Maquina: ' + maquinaLabel];
    const emptyRow = [];

    const resumenHeader = ['=== RESUMEN MENSUAL ==='];
    const resumenCols = [
      'Maquina', 'Mes', 'Meta Kg', 'Produccion Kg', 'Metros ML',
      'T.Produccion (min)', 'T.Parada (min)', 'T.Total (min)',
      'Desperdicio Kg', 'Desperdicio ML', '% Desp Kg', '% Desp ML',
      'Total Trabajos', 'Tinta Blanco Kg', 'Tinta Varias Kg', 'Tinta Total Kg',
      'Vel Real Prom', 'Vel Teorica Prom'
    ];

    const paradasHeader = ['=== TOTALES PARADAS ==='];
    const paradasCols = ['Maquina', 'Mes', 'Motivo', 'Total Minutos'];

    const wsData = [
      titleRow,
      periodRow,
      machineRow,
      emptyRow,
      resumenHeader,
      resumenCols,
      ...resumenRows,
      emptyRow,
      emptyRow,
      paradasHeader,
      paradasCols,
      ...paradasRows,
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
      { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'RESUMEN_MENSUAL');

    try {
      await logsRepository.create({
        usuario_id: null,
        accion: 'EXPORT',
        descripcion: '[EXPORTACION] Reporte resumen mensual generado (' + resumenRows.length + ' meses, ' + paradasRows.length + ' registros de paradas).',
        tipo: 'info'
      });
    } catch (e) { /* swallow */ }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }


  /**
   * Verifica que los datos del Excel coincidan con la DB sin importar.
   * Retorna un reporte de diferencias.
   * NOTA: Requiere que el repositorio exponga findParadasByMaquinaYPeriodo()
   */
  async verifyExcel(buffer, maquinaNombre, fechaInicio = null, fechaFin = null) {
    const maquina_id = MAQUINA_IDS[maquinaNombre?.toUpperCase()];
    if (!maquina_id) throw new AppError('Máquina inválida. Use OLYMPIA o NOVOFLEX.', HTTP_STATUS.BAD_REQUEST);

    // Fechas por defecto: mes actual
    const hoy = new Date();
    const defaultInicio = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
    const defaultFin = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-31`;
    const fInicio = fechaInicio || defaultInicio;
    const fFin = fechaFin || defaultFin;

    const parser = new ExcelTrabajoParser(maquinaNombre);
    const rows = parser.readWorkbook(buffer);
    const startRow = parser.detectStartRow(rows);
    const paradasMap = parser.detectParadasSwap(rows, startRow);

    // ── Leer Excel ──
    const excelData = {};
    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      if (parser.isEndOfData(row)) break;
      const pc = String(row[0]).trim();
      const fecha = excelSerialToDate(row[COL.FECHA]);
      if (!fecha) continue;
      if (!excelData[pc]) excelData[pc] = { paradas: {}, fecha, cliente: String(row[COL.CLIENTE] || '') };

      paradasMap.forEach(p => {
        let val = 0;
        const raw = row[p.col];
        if (typeof raw === 'number') val = raw;
        else if (raw && raw.result) val = parseInt(raw.result) || 0;
        excelData[pc].paradas[p.id] = (excelData[pc].paradas[p.id] || 0) + val;
      });
    }

    // ── Obtener datos de DB vía repositorio (sin pool.query directo) ──
    // NOTA: Debes implementar estos métodos en tu repositorio
    const trabajos = await trabajosRepository.findByMaquinaYPeriodo(maquina_id, fInicio, fFin);
    const paradas = await trabajosRepository.findParadasByMaquinaYPeriodo(maquina_id, fInicio, fFin);

    const parByTrabajo = {};
    paradas.forEach(p => {
      if (!parByTrabajo[p.trabajo_id]) parByTrabajo[p.trabajo_id] = {};
      parByTrabajo[p.trabajo_id][p.motivo_id] = p.minutos;
    });

    const dbData = {};
    trabajos.forEach(t => {
      const key = t.numero_pedido;
      if (!dbData[key]) dbData[key] = { paradas: {} };
      const p = parByTrabajo[t.id] || {};
      for (const [mid, min] of Object.entries(p)) {
        dbData[key].paradas[mid] = (dbData[key].paradas[mid] || 0) + min;
      }
    });

    // ── Comparar ──
    const reporte = {
      maquina: maquinaNombre,
      periodo: { inicio: fInicio, fin: fFin },
      total_excel: 0,
      total_db: 0,
      coinciden: 0,
      diferencias: [],
      solo_excel: [],
      solo_db: [],
    };
    let totalEx = 0, totalDb = 0;

    for (const [pedido, ex] of Object.entries(excelData)) {
      const exTotal = Object.values(ex.paradas).reduce((s, v) => s + v, 0);
      totalEx += exTotal;
      const db = dbData[pedido];
      if (!db) { reporte.solo_excel.push({ pedido, total: exTotal }); continue; }
      const dbTotal = Object.values(db.paradas).reduce((s, v) => s + v, 0);
      totalDb += dbTotal;
      if (exTotal !== dbTotal) {
        const diffs = [];
        for (let mid = 1; mid <= 18; mid++) {
          const exV = ex.paradas[mid] || 0;
          const dbV = db.paradas[mid] || 0;
          if (exV !== dbV) diffs.push({ motivo_id: mid, excel: exV, db: dbV });
        }
        reporte.diferencias.push({ pedido, excel_total: exTotal, db_total: dbTotal, detalles: diffs });
      } else {
        reporte.coinciden++;
      }
    }

    for (const [pedido, db] of Object.entries(dbData)) {
      if (!excelData[pedido]) {
        const dbTotal = Object.values(db.paradas).reduce((s, v) => s + v, 0);
        reporte.solo_db.push({ pedido, total: dbTotal });
        totalDb += dbTotal;
      }
    }

    reporte.total_excel = totalEx;
    reporte.total_db = totalDb;
    reporte.diferencia_min = totalEx - totalDb;
    return reporte;
  }

  // ── Métodos privados ────────────────────────────────────────────────────────

  _validate(data) {
    if (!data.maquina_id) throw new AppError('La máquina es obligatoria.', HTTP_STATUS.BAD_REQUEST);
    if (!data.numero_pedido) throw new AppError('El número de pedido es obligatorio.', HTTP_STATUS.BAD_REQUEST);
    if (!data.fecha) throw new AppError('La fecha es obligatoria.', HTTP_STATUS.BAD_REQUEST);
    if (!data.cliente) throw new AppError('El cliente es obligatorio.', HTTP_STATUS.BAD_REQUEST);
    if (!data.producto) throw new AppError('El producto es obligatorio.', HTTP_STATUS.BAD_REQUEST);
  }

  _extractParadas(data) {
    if (!data.paradas) return [];
    return Object.entries(data.paradas).map(([motivo_id, minutos]) => ({
      motivo_id: parseInt(motivo_id),
      minutos: parseInt(minutos) || 0,
    }));
  }

  async _logAction(accion, data, velocidadData, desperdicioData, usuario_id) {
    try {
      const maquinaNombre = data.maquina_id === 1 ? 'OLYMPIA' : 'NOVOFLEX';
      const prefix = accion === 'CREATE_JOB' ? '[CARGA MANUAL]' : '[EDICIÓN MANUAL]';
      let desc = `${prefix} Orden #${data.numero_pedido} en ${maquinaNombre}.`;
      if (velocidadData?.real) desc += ` Eficiencia: ${velocidadData.real}m/min.`;
      if (desperdicioData?.cantidad_kg) desc += ` Desperdicio: ${desperdicioData.cantidad_kg}kg.`;

      await logsRepository.create({
        usuario_id,
        accion,
        descripcion: desc,
        tipo: accion === 'CREATE_JOB' ? 'success' : 'info'
      });
    } catch (logErr) {
      console.error('Error log action:', logErr);
    }
  }

  async _logImport(resultados, maquinaNombre) {
    try {
      let desc = `[IMPORTACIÓN EXCEL] Se cargaron ${resultados.insertados} trabajos en ${maquinaNombre}.`;
      if (resultados.actualizados > 0) desc += ` (${resultados.actualizados} trabajos actualizados).`;
      if (resultados.velocidad_insertada > 0) desc += ` Eficiencia detectada en ${resultados.velocidad_insertada} registros.`;
      if (resultados.desperdicio_insertado > 0) desc += ` Desperdicios detectados en ${resultados.desperdicio_insertado} registros.`;

      await logsRepository.create({
        usuario_id: null,
        accion: 'IMPORT',
        descripcion: desc,
        tipo: 'success'
      });
    } catch (logErr) {
      console.error('Error guardando log:', logErr);
    }
  }
}

module.exports = new TrabajosService();
