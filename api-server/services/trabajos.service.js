// ============================================================
// services/trabajos.service.js
// ============================================================
const XLSX = require('xlsx');
const trabajosRepository = require('../repositories/trabajos.repository');
const logsRepository = require('../repositories/logs.repository');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../utils/constants');
const { MOTIVOS_EXCEL_MAP } = require('../repositories/trabajos.repository');
const { pool } = require('../config/db');
const { getTurnoId } = require('../repositories/trabajos.repository');

// ── Columnas exactas del Excel (confirmadas por análisis) ─────────────────────
//  Col 2  → Fecha (serial Excel)
//  Col 5  → Destino
//  Col 8  → Cliente (nombre completo)
//  Col 9  → Producto
//  Col 10 → Meta Kg (cliente)
//  Col 11-28 → Paradas por categoría (minutos)
//  Col 29 → Total minutos parada
//  Col 30 → Total minutos producción
//  Col 31 → Total minutos (parada + producción)
//  Col 62 → Metros producidos PRODUCTO TERMINADO (m/l)
//  Col 67 → Solvente producción (Lts)
//  Col 69 → Consumo tinta blanco (Kg)
//  Col 70 → Consumo tinta varias (Kg)
//  Col 71 → Consumo tinta TOTAL (Kg)    → desperdicio.cantidad_kg
//  Col 72 → Velocidad teórica (m/min)
//  Col 73 → Velocidad real (m/min)
//  Col 74 → Desperdicio m/l             → desperdicio referencial
//  Col 78 → Desperdicio Kg              → desperdicio.cantidad_kg_film
//  Col 82 → Observaciones (texto)
//  Col 83 → Estado del pedido (REPETICION, PROCESO, etc.)

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

// Convierte número serial de Excel a fecha YYYY-MM-DD
function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

const MAQUINA_IDS = { 'OLYMPIA': 1, 'NOVOFLEX': 2 };

const STATUS_VALIDOS = [
  'PROCESO','REPETICION','APROBACION','SUSPENDIDO','LIMPIEZA',
  'PRUEBA','REPROCESO','FALTA DE INSUMO','PARADA PROGRAMADA',
];

// ──────────────────────────────────────────────────────────────────────────────

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
    if (!data.tiempo_total_min) {
      data.tiempo_total_min = (data.tiempo_produccion_min || 0) + (data.tiempo_parada_total_min || 0);
    }
    const paradasMinutos = this._extractParadas(data);
    const velocidadData  = data.velocidad || null;
    const desperdicioData = data.desperdicio || null;

    const trabajo = await trabajosRepository.create(data, paradasMinutos, velocidadData, desperdicioData);

    // ── Log Detallado ──
    try {
      const maquinaNombre = data.maquina_id === 1 ? 'OLYMPIA' : 'NOVOFLEX';
      let desc = `[CARGA MANUAL] Orden #${data.numero_pedido} en ${maquinaNombre}.`;
      if (velocidadData?.real) desc += ` Eficiencia: ${velocidadData.real}m/min.`;
      if (desperdicioData?.cantidad_kg) desc += ` Desperdicio: ${desperdicioData.cantidad_kg}kg.`;

      await logsRepository.create({
        usuario_id,
        accion: 'CREATE_JOB',
        descripcion: desc,
        tipo: 'success'
      });
    } catch (logErr) {
      console.error('Error log creation:', logErr);
    }

    return trabajo;
  }

  async update(id, data, usuario_id = null) {
    this._validate(data);
    if (!data.tiempo_total_min) {
      data.tiempo_total_min = (data.tiempo_produccion_min || 0) + (data.tiempo_parada_total_min || 0);
    }
    const paradasMinutos = this._extractParadas(data);
    const velocidadData  = data.velocidad || null;
    const desperdicioData = data.desperdicio || null;

    const result = await trabajosRepository.update(id, data, paradasMinutos, velocidadData, desperdicioData);

    // ── Log Detallado ──
    try {
      const maquinaNombre = data.maquina_id === 1 ? 'OLYMPIA' : 'NOVOFLEX';
      let desc = `[EDICIÓN MANUAL] Orden #${data.numero_pedido} en ${maquinaNombre}.`;
      if (velocidadData?.real) desc += ` Nueva Eficiencia: ${velocidadData.real}m/min.`;
      
      await logsRepository.create({
        usuario_id,
        accion: 'UPDATE_JOB',
        descripcion: desc,
        tipo: 'info'
      });
    } catch (logErr) {
      console.error('Error log update:', logErr);
    }

    return result;
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
    const maquina_id = MAQUINA_IDS[maquinaNombre?.toUpperCase()];
    if (!maquina_id) {
      throw new AppError('Máquina inválida. Use OLYMPIA o NOVOFLEX.', HTTP_STATUS.BAD_REQUEST);
    }

    const wb = XLSX.read(buffer, { type: 'buffer' });

    const sheetName = wb.SheetNames.find(n =>
      n.toUpperCase().replace(/\./g, '').trim() === maquinaNombre.toUpperCase()
    );
    if (!sheetName) {
      throw new AppError(`Hoja "${maquinaNombre}" no encontrada en el Excel.`, HTTP_STATUS.BAD_REQUEST);
    }

    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

    const resultados = {
      insertados: 0,
      duplicados: 0,
      errores: [],
      velocidad_insertada: 0,
      desperdicio_insertado: 0,
      preview: [],
    };

    for (let i = 14; i < rows.length; i++) {
      const row = rows[i];

      // Detectar fin de datos
      if (!row || !row[0] || typeof row[0] !== 'string' || row[0].trim() === '') continue;
      const primerCol = row[0].trim();
      if (
        primerCol.startsWith('OF=') ||
        primerCol.startsWith('OP=') ||
        primerCol.startsWith('Nota') ||
        primerCol.startsWith('EL PROMEDIO')
      ) break;

      try {
        // ── Datos del trabajo ───────────────────────────────────────
        const numero_pedido = primerCol;
        const fecha         = excelSerialToDate(row[COL.FECHA]);
        const cliente       = String(row[COL.CLIENTE] || '').trim();
        const producto      = String(row[COL.PRODUCTO] || '').trim();
        const destino_raw   = String(row[COL.DESTINO] || 'LAMINACION').trim().toUpperCase();
        const destino       = ['LAMINACION','CORTE','TODAS'].includes(destino_raw) ? destino_raw : 'LAMINACION';
        const meta_kg       = parseFloat(row[COL.META_KG]) || 0;

        const tiempo_parada_total_min = parseInt(row[COL.TIEMPO_PARADA]) || 0;
        const tiempo_produccion_min   = parseInt(row[COL.TIEMPO_PROD])   || 0;
        const tiempo_total_min        = parseInt(row[COL.TIEMPO_TOTAL])  || 0;
        const metros_producidos       = parseFloat(row[COL.METROS_ML])   || 0;

        // Estado: col 83, fallback buscando en últimas columnas
        let status_orden = 'PROCESO';
        const estadoCol = String(row[COL.ESTADO] || '').trim().toUpperCase();
        if (STATUS_VALIDOS.includes(estadoCol)) {
          status_orden = estadoCol;
        } else {
          for (let c = row.length - 1; c >= row.length - 15 && c >= 0; c--) {
            const v = String(row[c] || '').trim().toUpperCase();
            if (STATUS_VALIDOS.includes(v)) { status_orden = v; break; }
          }
        }

        // Observaciones: col 82
        const observaciones = typeof row[COL.OBSERVACIONES] === 'string' && row[COL.OBSERVACIONES].length > 5
          ? row[COL.OBSERVACIONES].trim()
          : null;

        // ── Paradas por categoría ────────────────────────────────────
        const paradasMinutos = MOTIVOS_EXCEL_MAP.map(m => ({
          motivo_id: m.id,
          minutos: parseInt(row[m.col]) || 0,
        }));

        // ── Velocidad ────────────────────────────────────────────────
        const vel_teorica = parseFloat(row[COL.VEL_TEORICA]) || null;
        const vel_real    = parseFloat(row[COL.VEL_REAL])    || null;

        // ── Desperdicio ──────────────────────────────────────────────
        const desp_kg      = parseFloat(row[COL.DESP_KG])       || 0; // kg film desperdiciado
        const desp_tinta   = parseFloat(row[COL.TINTA_TOTAL_KG]) || 0; // consumo total tinta (Kg)
        const desp_solvente = parseFloat(row[COL.SOLVENTE_LTS])  || 0; // solvente (Lts)

        // ── Validación mínima ────────────────────────────────────────
        if (!fecha || !cliente || !producto) {
          resultados.errores.push({ fila: i + 1, razon: 'Datos incompletos (fecha/cliente/producto)' });
          continue;
        }

        const trabajoData = {
          maquina_id, numero_pedido, fecha, cliente, producto, destino, meta_kg,
          metros_producidos, tiempo_produccion_min, tiempo_parada_total_min,
          tiempo_total_min, status_orden, observaciones,
        };

        // ── Modo Preview ─────────────────────────────────────────────
        if (preview) {
          resultados.preview.push({
            ...trabajoData,
            paradas:    paradasMinutos.filter(p => p.minutos > 0),
            velocidad:  { teorica: vel_teorica, real: vel_real },
            desperdicio: { kg_film: desp_kg, tinta_kg: desp_tinta, solvente_lts: desp_solvente },
          });
          continue;
        }

        // ── Verificar duplicado ──────────────────────────────────────
        const existente = await trabajosRepository.existsByPedidoMaquinaFecha(numero_pedido, maquina_id, fecha);
        if (existente) {
          resultados.duplicados++;
          continue;
        }

        // ── Guardar en transacción: trabajo + paradas + velocidad + desperdicio ──
        const trabajo = await trabajosRepository.create(trabajoData, paradasMinutos);
        resultados.insertados++;

        // Velocidad (solo si tiene datos)
        if (vel_teorica || vel_real) {
          const conn = await pool.getConnection();
          try {
            const turno_id = await getTurnoId(conn, 'A'); // Excel no especifica turno, default A
            await conn.execute(
              `INSERT INTO velocidad
                (maquina_id, trabajo_id, turno_id, fecha, velocidad_teorica_mlmin, velocidad_real_mlmin)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [maquina_id, trabajo.id, turno_id, fecha, vel_teorica, vel_real]
            );
            resultados.velocidad_insertada++;
          } finally {
            conn.release();
          }
        }

        // Desperdicio (kg film + tinta si hay datos)
        if (desp_kg > 0 || desp_tinta > 0 || desp_solvente > 0) {
          const [r] = await pool.execute(
            `INSERT INTO desperdicios
              (maquina_id, trabajo_id, cantidad_kg, cantidad_ml, comentario, fecha)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              maquina_id,
              trabajo.id,
              desp_kg + desp_tinta,  // kg total (film desperdiciado + tinta consumida)
              desp_solvente,          // litros de solvente
              `Film: ${desp_kg} kg | Tinta: ${desp_tinta} kg | Solvente: ${desp_solvente} lts`,
              fecha,
            ]
          );
          resultados.desperdicio_insertado++;
        }

      } catch (err) {
        resultados.errores.push({ fila: i + 1, razon: err.message });
      }
    }

    // ── Registrar en Logs de Actividad ──
    try {
      let desc = `[IMPORTACIÓN EXCEL] Se cargaron ${resultados.insertados} trabajos en ${maquinaNombre}.`;
      if (resultados.duplicados > 0) desc += ` (${resultados.duplicados} omitidos por duplicidad).`;
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

    return resultados;
  }

  /**
   * Exportar trabajos a Excel consolidado con todos los parámetros
   * Organizado por bloques: Identificación, Producción, Eficiencia, Desperdicios y Paradas Detalladas
   */
  async exportToExcel(filters) {
    const trabajos = await trabajosRepository.findAllDetailed(filters);
    const motivos = MOTIVOS_EXCEL_MAP.sort((a, b) => a.id - b.id); // Asegurar orden correlativo

    const wb = XLSX.utils.book_new();

    // 1. Definir Encabezados
    const headers = [
      // Bloque Identificación
      'Pedido', 'Máquina', 'Fecha', 'Cliente', 'Producto', 'Destino', 'Estado',
      // Bloque Producción
      'Meta Kg', 'Metros Reales', 'T. Producción (min)', 'T. Parada (min)', 'T. Total Turno (min)',
      // Bloque Eficiencia
      'Vel. Real (m/min)', 'Vel. Teórica (m/min)', '% Rendimiento',
      // Bloque Desperdicios
      'Desperdicio Kg', 'Solvente (Lts)', 'Comentario Desperdicio',
      // Bloque Paradas Detalladas
      'PREPARACION', 'PRE-PRENSA', 'COLORIMETRIA', 'CALIDAD', 'MANTENIMIENTO', 
      'LIMPIEZA MAQUINA', 'PLANIFICACION', 'LIMPIEZA PLANCHA', 'LIMPIEZA RODILLO', 
      'LIMPIEZA TAMBOR', 'PRODUCCION', 'PRUEBAS', 'LOGISTICA', 'FALLAS ELECTRICAS', 
      'APROBACIONES', 'ESTANDAR COLOR', 'RRHH', 'FALTA INSUMO',
      // Final
      'Observaciones'
    ];

    // 2. Mapear Datos
    const rows = trabajos.map(t => {
      // Calcular Rendimiento %
      const rendimiento = t.velocidad?.teorica > 0 
        ? ((t.velocidad.real / t.velocidad.teorica) * 100).toFixed(1) + '%' 
        : '0%';

      // Mapear paradas a sus columnas correspondientes
      const paradasCols = motivos.map(m => {
        const p = t.paradas.find(p => p.motivo_id === m.id);
        return p ? p.minutos : 0;
      });

      return [
        // Identificación
        t.numero_pedido, t.maquina_nombre, t.fecha, t.cliente, t.producto, t.destino, t.status_orden,
        // Producción
        t.meta_kg, t.metros_producidos, t.tiempo_produccion_min, t.tiempo_parada_total_min, t.tiempo_total_min,
        // Eficiencia
        t.velocidad?.real || 0, t.velocidad?.teorica || 0, rendimiento,
        // Desperdicios
        t.desperdicio?.cantidad_kg || 0, t.desperdicio?.cantidad_ml || 0, t.desperdicio?.comentario || '',
        // Paradas Detalladas (desplegadas)
        ...paradasCols,
        // Observaciones
        t.observaciones || ''
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Opcional: Ajustar anchos de columna (basico)
    ws['!cols'] = headers.map(() => ({ wch: 15 }));

    XLSX.utils.book_append_sheet(wb, ws, 'REPORTE_CONSOLIDADO');

    // Registrar acción en logs
    try {
      await logsRepository.create({
        usuario_id: null,
        accion: 'EXPORT',
        descripcion: `[EXPORTACIÓN] Reporte consolidado generado (${trabajos.length} registros).`,
        tipo: 'info'
      });
    } catch (e) {}

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  _validate(data) {
    if (!data.maquina_id)    throw new AppError('La máquina es obligatoria.',        HTTP_STATUS.BAD_REQUEST);
    if (!data.numero_pedido) throw new AppError('El número de pedido es obligatorio.', HTTP_STATUS.BAD_REQUEST);
    if (!data.fecha)         throw new AppError('La fecha es obligatoria.',            HTTP_STATUS.BAD_REQUEST);
    if (!data.cliente)       throw new AppError('El cliente es obligatorio.',          HTTP_STATUS.BAD_REQUEST);
    if (!data.producto)      throw new AppError('El producto es obligatorio.',         HTTP_STATUS.BAD_REQUEST);
  }

  _extractParadas(data) {
    if (!data.paradas) return [];
    return Object.entries(data.paradas).map(([motivo_id, minutos]) => ({
      motivo_id: parseInt(motivo_id),
      minutos: parseInt(minutos) || 0,
    }));
  }
}

module.exports = new TrabajosService();
