import * as z from "zod";

// ── Legacy (mantener por compatibilidad hasta migrar completamente) ──────────
export const productionFormSchema = z.object({
  maquina_nombre: z.string().min(1, "Máquina requerida"),
  maquina_estado: z.string().min(1, "Estado requerido"),
  cliente: z.string().min(1, "Cliente requerido"),
  producto: z.string().min(1, "Producto requerido"),
  metros: z.coerce.number().min(0, "Mínimo 0"),
  fecha: z.string().min(1, "Fecha requerida"),
  status_orden: z.string().min(1, "Estatus requerido"),
});
export type ProductionFormValues = z.infer<typeof productionFormSchema>;

export const stopsFormSchema = z.object({
  maquina_nombre: z.string().min(1, "Máquina requerida"),
  motivo_nombre: z.string().min(1, "Motivo requerido"),
  fecha: z.string().min(1, "Fecha requerida"),
  hora_inicio: z.string().min(1, "Hora de inicio requerida"),
  hora_fin: z.string().min(1, "Hora de fin requerida"),
  tipo: z.enum(["programada", "no_programada"]),
  comentario: z.string().optional(),
});
export type StopsFormValues = z.infer<typeof stopsFormSchema>;

export const wasteFormSchema = z.object({
  maquina_id: z.coerce.number().min(1, "Máquina requerida"),
  cantidad_kg: z.coerce.number().min(0, "Mínimo 0"),
  cantidad_ml: z.coerce.number().min(0, "Mínimo 0"),
  observaciones: z.string().optional(),
});
export type WasteFormValues = z.infer<typeof wasteFormSchema>;

export const informacionFormSchema = z.object({
  titulo: z.string().min(3, "El título es muy corto").max(100),
  contenido: z.string().min(5, "El contenido es muy corto"),
  prioridad: z.enum(["baja", "media", "alta"]),
  fecha_publicacion: z.string(),
  fecha_expiracion: z.string().optional().nullable(),
  activo: z.number().int().min(0).max(1),
});
export type InformacionFormValues = z.infer<typeof informacionFormSchema>;

// ── Nuevos schemas ────────────────────────────────────────────────────────────

export const MOTIVOS_PARADA = [
  { id: 1,  nombre: "PREPARACION" },
  { id: 2,  nombre: "PRE-PRENSA" },
  { id: 3,  nombre: "COLORIMETRIA" },
  { id: 4,  nombre: "CALIDAD" },
  { id: 5,  nombre: "MANTENIMIENTO" },
  { id: 6,  nombre: "LIMPIEZA GENERAL DE MAQUINA" },
  { id: 7,  nombre: "PLANIFICACION" },
  { id: 8,  nombre: "LIMPIEZA DE PLANCHA" },
  { id: 9,  nombre: "LIMPIEZA DE RODILLO" },
  { id: 10, nombre: "LIMPIEZA DE TAMBOR CENTRAL" },
  { id: 11, nombre: "PRODUCCION" },
  { id: 12, nombre: "PRUEBAS" },
  { id: 13, nombre: "LOGISTICA" },
  { id: 14, nombre: "FALLAS ELECTRICAS" },
  { id: 15, nombre: "APROBACIONES" },
  { id: 16, nombre: "ESTANDAR DE COLOR" },
  { id: 17, nombre: "RRHH" },
  { id: 18, nombre: "FALTA DE INSUMO / PEDIDO" },
] as const;

export const STATUS_ORDEN_OPTIONS = [
  "PROCESO", "REPETICION", "APROBACION", "SUSPENDIDO",
  "LIMPIEZA", "PRUEBA", "REPROCESO", "FALTA DE INSUMO", "PARADA PROGRAMADA",
] as const;

// Paradas: objeto con motivo_id como clave y minutos como valor
const paradasSchema = z.record(z.string(), z.coerce.number().min(0).default(0));

export const trabajoFormSchema = z.object({
  maquina_id:              z.coerce.number().min(1, "Máquina requerida"),
  numero_pedido:           z.string().min(1, "Número de pedido requerido"),
  fecha:                   z.string().min(1, "Fecha requerida"),
  cliente:                 z.string().min(1, "Cliente requerido"),
  producto:                z.string().min(1, "Producto requerido"),
  destino:                 z.enum(["LAMINACION", "CORTE", "TODAS"]).default("LAMINACION"),
  meta_kg:                 z.coerce.number().min(0).default(0),
  metros_producidos:       z.coerce.number().min(0).default(0),
  tiempo_produccion_min:   z.coerce.number().min(0).default(0),
  tiempo_parada_total_min: z.coerce.number().min(0).default(0),
  tiempo_total_min:        z.coerce.number().min(0).default(0),
  status_orden:            z.enum(STATUS_ORDEN_OPTIONS).default("PROCESO"),
  observaciones:           z.string().optional(),
  paradas:                 paradasSchema.optional(),
  
  // Datos opcionales para carga atómica
  velocidad: z.object({
    turno: z.enum(["A", "B", "C"]).default("A"),
    teorica: z.coerce.number().min(0).default(0),
    real: z.coerce.number().min(0).default(0),
  }).optional(),
  
  desperdicio: z.object({
    cantidad_kg: z.coerce.number().min(0).default(0),
    cantidad_ml: z.coerce.number().min(0).default(0),
    comentario: z.string().optional(),
  }).optional(),
});
export type TrabajoFormValues = z.infer<typeof trabajoFormSchema>;

export const velocidadFormSchema = z.object({
  maquina_id:               z.coerce.number().min(1, "Máquina requerida"),
  trabajo_id:               z.coerce.number().optional(),
  fecha:                    z.string().min(1, "Fecha requerida"),
  turno:                    z.enum(["A", "B", "C"]).default("A"),
  velocidad_teorica_mlmin:  z.coerce.number().min(0, "Mínimo 0"),
  velocidad_real_mlmin:     z.coerce.number().min(0, "Mínimo 0"),
  observaciones:            z.string().optional(),
});
export type VelocidadFormValues = z.infer<typeof velocidadFormSchema>;
