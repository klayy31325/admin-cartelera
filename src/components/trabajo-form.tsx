"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  trabajoFormSchema, type TrabajoFormValues,
  MOTIVOS_PARADA, STATUS_ORDEN_OPTIONS
} from "@/lib/schemas";
import {
  ClipboardList, Calendar, User, Gauge,
  Clock, Save, Loader2, Zap, Trash2, LayoutGrid,
  TrendingUp, FileText, Settings, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api-config";

export function TrabajoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<TrabajoFormValues>({
    resolver: zodResolver(trabajoFormSchema),
    defaultValues: {
      maquina_id: 1,
      numero_pedido: "",
      fecha: today,
      cliente: "",
      producto: "",
      destino: "LAMINACION",
      meta_kg: 0,
      metros_producidos: 0,
      tiempo_produccion_min: 0,
      tiempo_parada_total_min: 0,
      tiempo_total_min: 0,
      status_orden: "PROCESO",
      observaciones: "",
      paradas: {},
      velocidad: { turno: "A", teorica: 0, real: 0 },
      desperdicio: { cantidad_kg: 0, cantidad_ml: 0, comentario: "" },
    },
  });

  const watchValues = form.watch();
  const totalMin = (Number(watchValues.tiempo_produccion_min) || 0) + (Number(watchValues.tiempo_parada_total_min) || 0);
  const desperdicioKg = Number(watchValues.desperdicio?.cantidad_kg) || 0;
  const desperdicioMl = Number(watchValues.desperdicio?.cantidad_ml) || 0;
  const eficiencia = watchValues.velocidad?.teorica > 0 
    ? Math.round((watchValues.velocidad.real / watchValues.velocidad.teorica) * 100) 
    : 0;

  async function onSubmit(values: TrabajoFormValues) {
    values.tiempo_total_min = totalMin;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("curex_token");
      const res = await fetch(`${API_BASE_URL}/trabajos`, {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Error al registrar");

      toast.success("Operación registrada correctamente en la base de datos");
      form.reset({ 
        ...form.getValues(), 
        numero_pedido: "", 
        cliente: "", 
        producto: "", 
        observaciones: "",
        paradas: {},
        velocidad: { turno: "A", teorica: 0, real: 0 },
        desperdicio: { cantidad_kg: 0, cantidad_ml: 0, comentario: "" }
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fallo en la conexión");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* HUD de Resumen Superior */}
      <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/[0.05] p-6 sticky top-4 z-30 shadow-xl rounded-xl flex flex-wrap items-center justify-between gap-6 overflow-hidden">
        <div className="flex items-center gap-4 relative">
          <div className="bg-brand w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
            <ClipboardList size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Orden de Producción</p>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase font-mono">
              {watchValues.numero_pedido || "MODO MANUAL"}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 md:gap-12 relative">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Clock size={10} className="text-brand" /> Tiempo Total</p>
            <p className="text-lg font-black text-zinc-900 dark:text-white font-mono">{totalMin} <span className="text-[10px] text-zinc-500 uppercase">min</span></p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Trash2 size={10} className="text-purple-500" /> Desperdicio</p>
            <p className="text-lg font-black text-zinc-900 dark:text-white font-mono">{desperdicioKg} <span className="text-[10px] text-zinc-500 uppercase">kg</span> / {desperdicioMl} <span className="text-[10px] text-zinc-500 uppercase">m/l</span></p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><TrendingUp size={10} className="text-green-500" /> Eficiencia</p>
            <p className={cn("text-lg font-black font-mono", eficiencia > 80 ? "text-green-500" : eficiencia > 50 ? "text-amber-500" : "text-red-500")}>{eficiencia}%</p>
          </div>
        </div>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
          
          {/* PANEL PRINCIPAL UNIFICADO */}
          <Card className="p-8 md:p-10 bg-white dark:bg-zinc-900/20 border-zinc-200 dark:border-white/[0.03] shadow-lg rounded-xl space-y-12">
            
            {/* PARTE 1: IDENTIFICACIÓN DEL TRABAJO */}
            <div className="space-y-6">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <LayoutGrid size={18} className="text-brand" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">1. Identificación del Trabajo</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="maquina_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Máquina / Unidad</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-sm font-bold">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.05]">
                          <SelectItem value="1">OLYMPIA</SelectItem>
                          <SelectItem value="2">NOVOFLEX</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Fecha del Turno</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-sm font-bold" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numero_pedido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">N° de Pedido (OF/OP)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 01-6075" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-sm font-bold uppercase" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del cliente..." {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-sm font-bold" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="producto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Nombre del Producto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Bobina Film PBD 40 micras..." {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-sm font-bold" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destino"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Área Destino</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-sm font-bold">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.05]">
                          <SelectItem value="LAMINACION">LAMINACIÓN</SelectItem>
                          <SelectItem value="CORTE">CORTE</SelectItem>
                          <SelectItem value="TODAS">TODAS</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status_orden"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 lg:col-span-1">
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Estatus Operativo de la Orden</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-sm font-bold">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.05]">
                          {STATUS_ORDEN_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* PARTE 2: CRONOMETRÍA Y VOLUMEN */}
            <div className="space-y-6 pt-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <Clock size={18} className="text-brand" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">2. Tiempos y Volúmenes de Producción</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="meta_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Meta Solicitada (Kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metros_producidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Metros Producidos (m)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tiempo_produccion_min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 text-green-500">Tiempo de Marcha (min)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-black font-mono text-green-500" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tiempo_parada_total_min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 text-red-500">Tiempo de Parada (min)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-black font-mono text-red-500" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* PARTE 3: EFICIENCIA Y DESPERDICIOS */}
            <div className="space-y-6 pt-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <Gauge size={18} className="text-brand" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">3. Métricas de Eficiencia y Desperdicios</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Panel de Velocidad */}
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-white/[0.03] rounded-xl border-l-4 border-l-amber-500 space-y-6">
                  <div className="flex items-center gap-2">
                    <Gauge size={16} className="text-amber-500" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Métricas de Velocidad</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="velocidad.turno"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase text-zinc-500">Turno</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 h-10 rounded-xl text-xs font-bold">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.05]">
                              <SelectItem value="A">TURNO A</SelectItem>
                              <SelectItem value="B">TURNO B</SelectItem>
                              <SelectItem value="C">TURNO C</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="velocidad.teorica"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase text-zinc-500">Vel. Teórica (m/min)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 h-10 rounded-xl text-xs font-bold font-mono" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="velocidad.real"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase text-zinc-500">Vel. Real (m/min)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 h-10 rounded-xl text-xs font-black font-mono text-amber-500" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Panel de Desperdicio */}
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-white/[0.03] rounded-xl border-l-4 border-l-purple-500 space-y-6">
                  <div className="flex items-center gap-2">
                    <Trash2 size={16} className="text-purple-500" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-500">Métricas de Desperdicio</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="desperdicio.cantidad_kg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase text-zinc-500">Film Desechado (Kg)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 h-10 rounded-xl text-xs font-black font-mono text-purple-500" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="desperdicio.cantidad_ml"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase text-zinc-500">Desecho Metros Lineales (m)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 h-10 rounded-xl text-xs font-black font-mono text-purple-400" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="desperdicio.comentario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] font-black uppercase text-zinc-500">Motivo o Detalle del Rechazo</FormLabel>
                        <FormControl>
                          <Input placeholder="Comentario sobre el desperdicio..." {...field} className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 h-10 rounded-xl text-xs" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* PARTE 4: DISTRIBUCIÓN DE TIEMPOS DE PARADA */}
            <div className="space-y-6 pt-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <ShieldAlert size={18} className="text-brand" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">4. Distribución de Tiempos de Parada (minutos)</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {MOTIVOS_PARADA.map((m) => (
                  <FormField
                    key={m.id}
                    control={form.control}
                    name={`paradas.${m.id}` as any}
                    render={({ field }) => (
                      <FormItem className="space-y-1.5 bg-zinc-50 dark:bg-white/[0.01] p-3 rounded-lg border border-zinc-200 dark:border-white/[0.03] hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                        <FormLabel className="text-[8px] font-black uppercase text-zinc-500 tracking-tighter block truncate">{m.nombre}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            value={field.value ?? ""} 
                            onChange={(e) => {
                              const val = e.target.value === "" ? "" : Number(e.target.value);
                              field.onChange(val);
                            }} 
                            placeholder="0"
                            className="bg-transparent border-zinc-200 dark:border-zinc-800 h-9 text-xs font-black font-mono text-zinc-800 dark:text-zinc-200" 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

          </Card>

          {/* OBSERVACIONES Y ACCIÓN */}
          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full">
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 block">Comentarios u Observaciones Generales del Turno</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ingresar cualquier comentario relevante o notas generales de la operación..." {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 rounded-xl min-h-[100px] text-sm" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-64 bg-brand hover:bg-brand/90 text-white font-black h-20 rounded-xl shadow-xl transition-all hover:scale-[1.02] uppercase tracking-widest flex flex-col gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <Save size={20} />
                  <span>Sincronizar Turno</span>
                </>
              )}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
