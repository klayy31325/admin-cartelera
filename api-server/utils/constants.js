// ============================================================
// utils/constants.js — Constantes del sistema
// ============================================================

const ROLES = {
  ADMIN: 'admin',
  OPERADOR: 'operador',
  VISOR: 'visor',
  EDITOR: 'editor',
};

const ROLES_HIERARCHY = {
  admin: ['admin', 'editor', 'operador', 'visor'],
  editor: ['editor', 'visor'],
  operador: ['operador', 'visor'],
  visor: ['visor'],
};

const SALT_ROUNDS = 10;

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

module.exports = { ROLES, SALT_ROUNDS, HTTP_STATUS };
