// ============================================================
// controllers/trabajos.controller.js
// ============================================================
const trabajosService = require('../services/trabajos.service');
const produccionService = require('../services/produccion.service');
const { HTTP_STATUS } = require('../utils/constants');
const { getIO } = require('../socket');

// Helper: emite production-update sin bloquear la respuesta
async function emitProductionUpdate() {
  try {
    const summary = await produccionService.getSummaryByDate(null);
    getIO().emit('production-update', summary);
  } catch (_) { /* WS no debe romper el flujo HTTP */ }
}

class TrabajosController {
  async getAll(req, res, next) {
    try {
      const { maquina_id, fecha_inicio, fecha_fin, status_orden } = req.query;
      const data = await trabajosService.getAll({ maquina_id, fecha_inicio, fecha_fin, status_orden });
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const data = await trabajosService.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const data = await trabajosService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Trabajo creado.', data });
      emitProductionUpdate();
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const data = await trabajosService.update(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({ success: true, message: 'Trabajo actualizado.', data });
      emitProductionUpdate();
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      const result = await trabajosService.delete(req.params.id);
      res.status(HTTP_STATUS.OK).json({ success: true, message: result.message });
    } catch (error) { next(error); }
  }

  async importExcel(req, res, next) {
    try {
      if (!req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: { message: 'Archivo Excel requerido.' }
        });
      }
      const maquinaNombre = req.body.maquina || req.query.maquina;
      const preview = req.query.preview === 'true';
      const resultado = await trabajosService.importFromExcel(req.file.buffer, maquinaNombre, preview);
      res.status(HTTP_STATUS.OK).json({ success: true, data: resultado });
      // Solo emitir si no es preview (datos reales insertados)
      if (!preview) emitProductionUpdate();
    } catch (error) { next(error); }
  }

  async importTotales(req, res, next) {
    try {
      if (!req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false, error: { message: 'Archivo Excel requerido.' }
        });
      }
      const maquinaNombre = req.body.maquina || req.query.maquina;
      const preview = req.query.preview === 'true';
      const resultado = await trabajosService.importTotales(req.file.buffer, maquinaNombre, preview);
      res.status(HTTP_STATUS.OK).json({ success: true, data: resultado });
    } catch (error) { next(error); }
  }

  async saveTotales(req, res, next) {
    try {
      const data = await trabajosService.saveTotales(req.body, req.usuario?.id);
      res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Totales guardados correctamente.', data });
      emitProductionUpdate();
    } catch (error) { next(error); }
  }

  async getResumenTotales(req, res, next) {
    try {
      const { maquina_id, mes } = req.query;
      const data = await trabajosService.getResumenTotales(maquina_id, mes);
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async exportExcel(req, res, next) {
    try {
      const { maquina_id, fecha_inicio, fecha_fin } = req.query;
      const buffer = await trabajosService.exportResumenExcel({ maquina_id, fecha_inicio, fecha_fin });
      res.setHeader('Content-Disposition', 'attachment; filename=produccion_resumen.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) { next(error); }
  }
}

module.exports = new TrabajosController();
