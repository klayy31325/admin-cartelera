"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  totalesFormSchema, type TotalesFormValues,
  MOTIVOS_PARADA,
} from "@/lib/schemas";
import {
  ClipboardList, Gauge,
  Clock, Save, Loader2, Trash2, LayoutGrid,
  TrendingUp, ShieldAlert, ToggleLeft, FlaskConical
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api-config";

const currentMonth = new Date().toISOString().slice(0, 7);

export function TotalesForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMetas, setShowMetas] = useState(false);

  const form = useForm<TotalesFormValues>({
    resolver: zodResolver(totalesFormSchema),
    defaultValues: {
      maquina_id: 1,
      mes: currentMonth,
      meta_kg: 0,
      metros_ml: 0,
      produccion_kg: 0,
      tiempo_prod_min: 0,
      tiempo_parada_min: 0,
      tiempo_total_min: 0,
      total_trabajos: 0,
      desperdicio_ml: 0,
      desperdicio_kg: 0,
      desperdicio_pct_kg: 0,
      desperdicio_pct_ml: 0,
      tinta_blanco_kg: 0,
      tinta_varias_kg: 0,
      tinta_total_kg: 0,
      vel_real_avg: 0,
      vel_teorica_avg: 0,
      paradas: {},
      metas_parada: MOTIVOS_PARADA.map(m => ({ motivo_id: m.id, valor_limite: 0 })),
    },
  });

  const watchValues = form.watch();
  const prodMin = Number(watchValues.tiempo_prod_min) || 0;
  const paradaMin = Number(watchValues.tiempo_parada_min) || 0;
  const totalMin = prodMin + paradaMin;
  const despKg = Number(watchValues.desperdicio_kg) || 0;
  const despMl = Number(watchValues.desperdicio_ml) || 0;
  const velReal = Number(watchValues.vel_real_avg) || 0;
  const velTeo = Number(watchValues.vel_teorica_avg) || 0;
  const eficiencia = velTeo > 0 ? Math.round((velReal / velTeo) * 100) : 0;

  async function onSubmit(values: TotalesFormValues) {
    values.tiempo_total_min = totalMin;
    if (!showMetas) {
      values.metas_parada = undefined;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("curex_token");
      const res = await fetch(`${API_BASE_URL}/trabajos/totales`, {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Error al guardar totales");

      toast.success(`Totales de ${values.mes} guardados correctamente`);
      form.reset({
        maquina_id: values.maquina_id,
        mes: values.mes,
        meta_kg: 0, metros_ml: 0, produccion_kg: 0,
        tiempo_prod_min: 0, tiempo_parada_min: 0, tiempo_total_min: 0,
        total_trabajos: 0,
        desperdicio_ml: 0, desperdicio_kg: 0,
        desperdicio_pct_kg: 0, desperdicio_pct_ml: 0,
        tinta_blanco_kg: 0, tinta_varias_kg: 0, tinta_total_kg: 0,
        vel_real_avg: 0, vel_teorica_avg: 0,
        paradas: {},
        metas_parada: MOTIVOS_PARADA.map(m => ({ motivo_id: m.id, valor_limite: 0 })),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fallo en la conexión");
    } finally {
      setIsSubmitting(false);
    }
  }

  const maquinaNombre = watchValues.maquina_id === 1 ? "OLYMPIA" : "NOVOFLEX";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/[0.05] p-6 sticky top-4 z-30 shadow-xl rounded-xl flex flex-wrap items-center justify-between gap-6 overflow-hidden">
        <div className="flex items-center gap-4 relative">
          <div className="bg-brand w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
            <ClipboardList size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Totales Mensuales</p>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase font-mono">
              {maquinaNombre} — {watchValues.mes || "SELECCIONE MES"}
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
            <p className="text-lg font-black text-zinc-900 dark:text-white font-mono">{despKg} <span className="text-[10px] text-zinc-500 uppercase">kg</span> / {despMl} <span className="text-[10px] text-zinc-500 uppercase">m/l</span></p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><TrendingUp size={10} className="text-green-500" /> Eficiencia</p>
            <p className={cn("text-lg font-black font-mono", eficiencia > 80 ? "text-green-500" : eficiencia > 50 ? "text-amber-500" : "text-red-500")}>{eficiencia}%</p>
          </div>
        </div>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">

          <Card className="p-8 md:p-10 bg-white dark:bg-zinc-900/20 border-zinc-200 dark:border-white/[0.03] shadow-lg rounded-xl space-y-12">

            <div className="space-y-6">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <LayoutGrid size={18} className="text-brand" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">1. Identificación</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  name="mes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Mes (YYYY-MM)</FormLabel>
                      <FormControl>
                        <Input type="text" inputMode="numeric" pattern="[0-9]{4}-[0-9]{2}" placeholder="YYYY-MM" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-sm font-bold" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <Clock size={18} className="text-brand" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">2. Volúmenes y Tiempos</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="meta_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Meta (Kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metros_ml"
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
                  name="produccion_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Producción (Kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="total_trabajos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Total Trabajos</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tiempo_prod_min"
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
                  name="tiempo_parada_min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 text-red-500">Tiempo de Parada (min)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-black font-mono text-red-500" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-500">Tiempo Total (min)</p>
                  <div className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-black font-mono text-blue-500 flex items-center px-4">
                    {totalMin}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <Gauge size={18} className="text-brand" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">3. Velocidad</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="vel_real_avg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Vel. Real Promedio (m/min)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vel_teorica_avg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Vel. Teórica Promedio (m/min)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <Trash2 size={18} className="text-brand" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">4. Desperdicio</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="desperdicio_ml"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Desperdicio (m)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="desperdicio_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Desperdicio (Kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="desperdicio_pct_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Desperdicio % (Kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="desperdicio_pct_ml"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Desperdicio % (m)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <FlaskConical size={18} className="text-brand" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">5. Tintas</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="tinta_blanco_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Tinta Blanco (Kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tinta_varias_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Tinta Varias (Kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tinta_total_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400">Tinta Total (Kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl text-base font-bold font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <ShieldAlert size={18} className="text-brand" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">6. Distribución de Tiempos de Parada (minutos)</h3>
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

            <div className="space-y-6 pt-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ToggleLeft size={18} className="text-brand" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">7. Metas de Parada (opcional)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMetas(!showMetas)}
                  className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all",
                    showMetas
                      ? "bg-brand/10 border-brand/30 text-brand"
                      : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500"
                  )}
                >
                  {showMetas ? "Cargar Metas" : "Usar Metas Anteriores"}
                </button>
              </div>

              {showMetas && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {MOTIVOS_PARADA.map((m) => (
                    <FormField
                      key={`meta-${m.id}`}
                      control={form.control}
                      name={`metas_parada.${m.id - 1}.valor_limite` as any}
                      render={({ field }) => (
                        <FormItem className="space-y-1.5 bg-amber-50 dark:bg-amber-500/[0.03] p-3 rounded-lg border border-amber-200 dark:border-amber-500/10 hover:border-amber-300 dark:hover:border-amber-500/30 transition-colors">
                          <FormLabel className="text-[8px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-tighter block truncate">
                            {m.nombre}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : Number(e.target.value);
                                field.onChange(val);
                              }}
                              placeholder="0%"
                              className="bg-transparent border-amber-200 dark:border-amber-500/20 h-9 text-xs font-black font-mono text-amber-700 dark:text-amber-300"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

          </Card>

          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
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
                  <span>Guardar Totales</span>
                </>
              )}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
