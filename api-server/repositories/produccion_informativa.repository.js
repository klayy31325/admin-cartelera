const { pool } = require('../config/db');

class ProduccionInformativaRepository {
  async findAll(empresa_id) {
    const [rows] = await pool.execute(
      `SELECT pi.*, m.nombre as maquina_nombre 
       FROM produccion_informativa pi
       LEFT JOIN maquinas m ON pi.maquina_id = m.id
       WHERE pi.empresa_id = ?
       ORDER BY
         CASE
           WHEN COALESCE(NULLIF(TRIM(LOWER(pi.estado)), ''), 'pendiente') = 'completado' THEN 1
           ELSE 0
         END ASC,
         pi.orden ASC,
         pi.fecha_asignada DESC,
         pi.id ASC`,
      [empresa_id]
    );
    return rows;
  }

  async findByMaquina(maquina_id, empresa_id) {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.execute(
      `SELECT pi.*, m.nombre as maquina_nombre 
       FROM produccion_informativa pi
       LEFT JOIN maquinas m ON pi.maquina_id = m.id
       WHERE pi.maquina_id = ?
         AND pi.empresa_id = ?
         AND (
           pi.fecha_asignada = ?
           OR COALESCE(NULLIF(TRIM(LOWER(pi.estado)), ''), 'pendiente') <> 'completado'
         )
       ORDER BY
         CASE
           WHEN COALESCE(NULLIF(TRIM(LOWER(pi.estado)), ''), 'pendiente') = 'completado' THEN 1
           ELSE 0
         END ASC,
         pi.orden ASC,
         pi.fecha_asignada ASC,
         pi.id ASC`,
      [maquina_id, empresa_id, today]
    );
    return rows;
  }

  async findById(id) {
    const [[row]] = await pool.execute('SELECT * FROM produccion_informativa WHERE id = ?', [id]);
    return row;
  }

  async getMaxOrden(empresa_id) {
    const [[row]] = await pool.execute(
      'SELECT MAX(orden) as max_orden FROM produccion_informativa WHERE empresa_id = ?',
      [empresa_id]
    );
    return row?.max_orden || 0;
  }

  async create(data) {
    const empresa_id = data.empresa_id || 2;
    const orden = data.orden !== undefined ? Number(data.orden) : 0;

    if (orden < 1) throw new Error('El orden debe ser un número positivo mayor o igual a 1');

    // Correr tareas existentes hacia abajo para hacer espacio
    await pool.execute(
      `UPDATE produccion_informativa 
       SET orden = orden + 1 
       WHERE empresa_id = ? AND orden >= ? 
       AND COALESCE(NULLIF(TRIM(LOWER(estado)), ''), 'pendiente') <> 'completado'`,
      [empresa_id, orden]
    );

    const [result] = await pool.execute(
      `INSERT INTO produccion_informativa 
       (empresa_id, maquina_id, tarea, meta_valor, descripcion_secundaria, prioridad, estado, fecha_asignada, orden) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empresa_id,
        data.maquina_id,
        data.tarea || '',
        data.meta_valor !== undefined ? data.meta_valor : null,
        data.descripcion_secundaria || null,
        data.prioridad || 'media',
        data.estado || 'pendiente',
        data.fecha_asignada || new Date().toISOString().split('T')[0],
        orden
      ]
    );
    return { id: result.insertId, ...data };
  }

  async resequenceActiveTasks(empresa_id) {
    const [activeTasks] = await pool.execute(
      `SELECT id FROM produccion_informativa 
       WHERE empresa_id = ? 
       AND COALESCE(NULLIF(TRIM(LOWER(estado)), ''), 'pendiente') <> 'completado'
       ORDER BY orden ASC, id ASC`,
      [empresa_id]
    );
    for (let i = 0; i < activeTasks.length; i++) {
      await pool.execute('UPDATE produccion_informativa SET orden = ? WHERE id = ?', [i + 1, activeTasks[i].id]);
    }
  }

  async update(id, data) {
    const current = await this.findById(id);
    if (!current) throw new Error('Registro no encontrado');

    const wasCompleted = current.estado === 'completado';
    const becomingCompleted = data.estado === 'completado';
    const uncompleting = wasCompleted && data.estado !== undefined && !becomingCompleted;

    let finalOrden;
    if (uncompleting) {
      const maxOrden = await this.getMaxOrden(current.empresa_id);
      finalOrden = maxOrden + 1;
    } else {
      finalOrden = data.orden !== undefined ? Number(data.orden) : current.orden;
    }

    if (finalOrden < 1) throw new Error('El orden debe ser un número positivo mayor o igual a 1');

    // Reordenamiento: correr tareas activas para hacer espacio/cerrar hueco
    if (data.orden !== undefined && !wasCompleted && !becomingCompleted && !uncompleting) {
      const oldOrden = current.orden;
      if (finalOrden < oldOrden) {
        // Subió de posición: correr hacia abajo las que están entre nueva y vieja
        await pool.execute(
          `UPDATE produccion_informativa 
           SET orden = orden + 1 
           WHERE empresa_id = ? AND id != ? AND orden >= ? AND orden < ? 
           AND COALESCE(NULLIF(TRIM(LOWER(estado)), ''), 'pendiente') <> 'completado'`,
          [current.empresa_id, id, finalOrden, oldOrden]
        );
      } else if (finalOrden > oldOrden) {
        // Bajó de posición: correr hacia arriba las que están entre vieja y nueva
        await pool.execute(
          `UPDATE produccion_informativa 
           SET orden = orden - 1 
           WHERE empresa_id = ? AND id != ? AND orden > ? AND orden <= ? 
           AND COALESCE(NULLIF(TRIM(LOWER(estado)), ''), 'pendiente') <> 'completado'`,
          [current.empresa_id, id, oldOrden, finalOrden]
        );
      }
    }

    await pool.execute(
      `UPDATE produccion_informativa 
       SET maquina_id = ?, tarea = ?, meta_valor = ?, descripcion_secundaria = ?, prioridad = ?, estado = ?, fecha_asignada = ?, orden = ? 
       WHERE id = ?`,
      [
        data.maquina_id !== undefined ? data.maquina_id : current.maquina_id,
        data.tarea !== undefined ? data.tarea : current.tarea,
        data.meta_valor !== undefined ? data.meta_valor : current.meta_valor,
        data.descripcion_secundaria !== undefined ? data.descripcion_secundaria : current.descripcion_secundaria,
        data.prioridad !== undefined ? data.prioridad : current.prioridad,
        data.estado !== undefined ? data.estado : current.estado,
        data.fecha_asignada !== undefined ? data.fecha_asignada : current.fecha_asignada,
        finalOrden,
        id
      ]
    );

    if (!wasCompleted && becomingCompleted) {
      await this.resequenceActiveTasks(current.empresa_id);
    }

    return { id, ...data };
  }

  async delete(id) {
    const [result] = await pool.execute('DELETE FROM produccion_informativa WHERE id = ?', [id]);
    return result;
  }
}

module.exports = new ProduccionInformativaRepository();
