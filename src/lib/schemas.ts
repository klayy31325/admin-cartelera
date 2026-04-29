import * as z from "zod";

export const stopSchema = z.object({
  event: z.string().min(1, "Requerido"),
  minutes: z.coerce.number().min(0, "Mínimo 0"),
});

export const productionFormSchema = z.object({
  machineId: z.string().min(1, "Máquina requerida"),
  shift: z.string().min(1, "Turno requerido"),
  clientId: z.string().min(1, "Cliente requerido"),
  productId: z.string().min(1, "Producto requerido"),
  date: z.string().min(1, "Fecha requerida"),
  
  daysWorked: z.coerce.number().min(0, "Mínimo 0"),
  meters: z.coerce.number().min(0, "Mínimo 0"),
  velocity: z.coerce.number().min(0, "Mínimo 0"),
  wasteML: z.coerce.number().min(0, "Mínimo 0"),
  wasteKG: z.coerce.number().min(0, "Mínimo 0"),

  jobNumber: z.string().min(1, "Requerido"),
  repetition: z.string().min(1, "Requerido"),
  approval: z.string().min(1, "Requerido"),
  suspension: z.string().min(1, "Requerido"),

  machineState: z.enum(["Listo", "Pausado", "Cancelado"]),
  productionStatus: z.enum(["pendiente", "progreso", "realizado"]),

  stops: z.array(stopSchema).optional(),
});

export type ProductionFormValues = z.infer<typeof productionFormSchema>;
