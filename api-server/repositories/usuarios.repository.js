// ============================================================
// repositories/usuarios.repository.js — Acceso directo a MySQL
// ============================================================
const { pool } = require('../config/db');

class UsuariosRepository {
  /**
   * Busca o crea un departamento por nombre.
   */
  async findOrCreateDepartamento(nombre) {
    // Si no se proporciona nombre, usamos 'GENERAL' como departamento base
    const deptoNombre = (nombre || 'GENERAL').trim().toUpperCase();
    const [rows] = await pool.execute('SELECT id FROM departamentos WHERE nombre = ?', [deptoNombre]);
    if (rows.length > 0) return rows[0].id;

    const [result] = await pool.execute('INSERT INTO departamentos (nombre) VALUES (?)', [deptoNombre]);
    return result.insertId;
  }

  /**
   * Busca un ID de rol por nombre. Default: 1 (admin).
   */
  async getRolId(nombre) {
    // Si no se especifica rol, asignar admin (ID=1) por defecto
    const rolNombre = (nombre || 'admin').trim().toLowerCase();
    const [rows] = await pool.execute('SELECT id FROM roles WHERE nombre = ?', [rolNombre]);
    if (rows.length > 0) return rows[0].id;
    return 1; // Default: admin
  }

  /**
   * Obtiene todos los usuarios (sin password).
   * @returns {Promise<Array>}
   */
  async findAll() {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nombre, u.apellido, u.correo, 
              e.nombre as empresa, d.nombre as departamento, r.nombre as rol, 
              u.empresa_id, u.departamento_id, u.rol_id 
       FROM usuarios u
       JOIN empresas e ON u.empresa_id = e.id
       JOIN departamentos d ON u.departamento_id = d.id
       JOIN roles r ON u.rol_id = r.id`
    );
    return rows;
  }

  /**
   * Busca un usuario por su ID.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nombre, u.apellido, u.correo, 
              e.nombre as empresa, d.nombre as departamento, r.nombre as rol, 
              u.empresa_id, u.departamento_id, u.rol_id 
       FROM usuarios u
       JOIN empresas e ON u.empresa_id = e.id
       JOIN departamentos d ON u.departamento_id = d.id
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Busca un usuario por correo (incluye password para login).
   * @param {string} correo
   * @returns {Promise<Object|null>}
   */
  async findByCorreo(correo) {
    const [rows] = await pool.execute(
      `SELECT u.*, e.nombre as empresa, d.nombre as departamento, r.nombre as rol
       FROM usuarios u
       JOIN empresas e ON u.empresa_id = e.id
       JOIN departamentos d ON u.departamento_id = d.id
       JOIN roles r ON u.rol_id = r.id
       WHERE u.correo = ?`,
      [correo]
    );
    return rows[0] || null;
  }

  /**
   * Crea un nuevo usuario en la base de datos.
   * @param {Object} userData - { nombre, apellido, correo, password, departamento_id, rol_id, empresa_id }
   * @returns {Promise<Object>} - El usuario creado con su ID
   */
  async create(userData) {
    const { nombre, apellido, correo, password, departamento_id, rol_id, empresa_id } = userData;
    const [result] = await pool.execute(
      `INSERT INTO usuarios (nombre, apellido, correo, password, departamento_id, rol_id, empresa_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, correo, password, departamento_id, rol_id, empresa_id]
    );
    return { id: result.insertId, nombre, apellido, correo, departamento_id, rol_id, empresa_id };
  }

  /**
   * Actualiza un usuario existente.
   * @param {number} id
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async update(id, userData) {
    const { nombre, apellido, correo, departamento_id, rol_id, empresa_id } = userData;
    const [result] = await pool.execute(
      `UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, departamento_id = ?, rol_id = ?, empresa_id = ?
       WHERE id = ?`,
      [nombre, apellido, correo, departamento_id, rol_id, empresa_id, id]
    );
    return { affectedRows: result.affectedRows };
  }

  /**
   * Actualiza la contraseña de un usuario.
   * @param {number} id
   * @param {string} hashedPassword
   * @returns {Promise<Object>}
   */
  async updatePassword(id, hashedPassword) {
    const [result] = await pool.execute(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    return { affectedRows: result.affectedRows };
  }

  /**
   * Elimina un usuario por su ID.
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );
    return { affectedRows: result.affectedRows };
  }
}

module.exports = new UsuariosRepository();
