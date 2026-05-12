"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  trabajoFormSchema, type TrabajoFormValues,
  MOTIVOS_PARADA
} from "@/lib/schemas";
import {
  ClipboardList, Calendar, User, Gauge,
  Clock, Save, Loader2, Zap, Trash2, LayoutGrid,
  History, TrendingUp
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function TrabajoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("básicos");
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
  const eficiencia = watchValues.velocidad?.teorica > 0 
    ? Math.round((watchValues.velocidad.real / watchValues.velocidad.teorica) * 100) 
    : 0;

  async function onSubmit(values: TrabajoFormValues) {
    values.tiempo_total_min = totalMin;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("curex_token");
      const res = await fetch("http://localhost:8000/api/trabajos", {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Error al registrar");

      toast.success("Operación registrada correctamente");
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
      setActiveTab("básicos");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fallo en la conexión");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/[0.05] p-5 sticky top-4 z-30 shadow-xl rounded-2xl flex flex-wrap items-center justify-between gap-6 overflow-hidden">
        <div className="flex items-center gap-4 relative">
           <div className="bg-brand w-12 h-12 rounded-xl flex items-center justify-center text-black shadow-lg shadow-brand/20">
             <ClipboardList size={24} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5">Orden de Producción</p>
             <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">
               {watchValues.numero_pedido || "MODO MANUAL"}
             </h3>
           </div>
        </div>

        <div className="flex flex-wrap gap-10 relative">
          <div className="space-y-1">
             <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Clock size={10} className="text-brand" /> Tiempo Total</p>
             <p className="text-xl font-black text-zinc-900 dark:text-white font-mono">{totalMin} <span className="text-[10px] text-zinc-500 uppercase">min</span></p>
          </div>
          <div className="space-y-1">
             <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Trash2 size={10} className="text-purple-500" /> Desperdicio</p>
             <p className="text-xl font-black text-zinc-900 dark:text-white font-mono">{desperdicioKg} <span className="text-[10px] text-zinc-500 uppercase">kg</span></p>
          </div>
          <div className="space-y-1">
             <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><TrendingUp size={10} className="text-green-500" /> Eficiencia</p>
             <p className={cn("text-xl font-black font-mono", eficiencia > 80 ? "text-green-500" : eficiencia > 50 ? "text-amber-500" : "text-red-500")}>{eficiencia}%</p>
          </div>
        </div>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full h-16 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/[0.03] p-1.5 gap-1.5 rounded-[1.25rem]">
              <TabsTrigger value="básicos" className="rounded-xl font-black uppercase text-[10px] tracking-[0.15em] data-[state=active]:bg-brand data-[state=active]:text-black shadow-lg transition-all">
                <LayoutGrid size={14} className="mr-2" /> Identificación
              </TabsTrigger>
              <TabsTrigger value="tiempos" className="rounded-xl font-black uppercase text-[10px] tracking-[0.15em] data-[state=active]:bg-brand data-[state=active]:text-black transition-all">
                <Clock size={14} className="mr-2" /> Cronometría
              </TabsTrigger>
              <TabsTrigger value="métricas" className="rounded-xl font-black uppercase text-[10px] tracking-[0.15em] data-[state=active]:bg-brand data-[state=active]:text-black transition-all">
                <Zap size={14} className="mr-2" /> Métricas
              </TabsTrigger>
              <TabsTrigger value="paradas" className="rounded-xl font-black uppercase text-[10px] tracking-[0.15em] data-[state=active]:bg-brand data-[state=active]:text-black transition-all">
                <History size={14} className="mr-2" /> Paradas
              </TabsTrigger>
            </TabsList>

            <div className="mt-8">
              <TabsContent value="básicos" className="outline-none">
                <Card className="p-10 bg-white dark:bg-zinc-900/20 border-zinc-200 dark:border-white/[0.03] shadow-sm rounded-[2.5rem] space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <FormField
                      control={form.control}
                      name="maquina_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Unidad de Producción</FormLabel>
                          <Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}>
                            <FormControl>
                              <SelectTrigger className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-14 rounded-2xl text-base font-bold">
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
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Fecha</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-14 rounded-2xl text-base font-bold" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numero_pedido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block">N° de Pedido</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: 01-6075" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-14 rounded-2xl text-base font-bold uppercase" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cliente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Cliente</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del cliente..." {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-14 rounded-2xl text-base font-bold" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="tiempos" className="outline-none">
                <Card className="p-10 bg-white dark:bg-zinc-900/20 border-zinc-200 dark:border-white/[0.03] shadow-sm rounded-[2.5rem] space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <FormField
                      control={form.control}
                      name="meta_kg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Meta Kg</FormLabel>
                          <FormControl><Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-14 rounded-2xl text-lg font-black" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="metros_producidos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Metros Totales</FormLabel>
                          <FormControl><Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-14 rounded-2xl text-lg font-black" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tiempo_produccion_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Producción (min)</FormLabel>
                          <FormControl><Input type="number" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-14 rounded-2xl text-lg font-black text-green-500" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tiempo_parada_total_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block">Parada (min)</FormLabel>
                          <FormControl><Input type="number" {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] h-14 rounded-2xl text-lg font-black text-red-500" /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="métricas" className="outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="p-8 bg-white dark:bg-zinc-900/30 border-zinc-200 dark:border-white/[0.03] shadow-lg rounded-[2.5rem] border-l-4 border-l-amber-500">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-6 flex items-center gap-2"><Zap size={14} /> EFICIENCIA</h4>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="velocidad.teorica"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-black uppercase text-zinc-500">Velocidad Teórica</FormLabel>
                            <FormControl><Input type="number" {...field} className="bg-zinc-50 dark:bg-zinc-900/50 h-12 rounded-xl font-bold" /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="velocidad.real"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-black uppercase text-zinc-500">Velocidad Real</FormLabel>
                            <FormControl><Input type="number" {...field} className="bg-zinc-50 dark:bg-zinc-900/50 h-12 rounded-xl font-black text-amber-500" /></FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                  <Card className="p-8 bg-white dark:bg-zinc-900/30 border-zinc-200 dark:border-white/[0.03] shadow-lg rounded-[2.5rem] border-l-4 border-l-purple-500">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-6 flex items-center gap-2"><Trash2 size={14} /> DESPERDICIO</h4>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="desperdicio.cantidad_kg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-black uppercase text-zinc-500">Material Perdido (Kg)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} className="bg-zinc-50 dark:bg-zinc-900/50 h-12 rounded-xl font-black text-purple-500" /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="desperdicio.comentario"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[9px] font-black uppercase text-zinc-500">Observación</FormLabel>
                            <FormControl><Input {...field} className="bg-zinc-50 dark:bg-zinc-900/50 h-12 rounded-xl" /></FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="paradas" className="outline-none">
                <Card className="p-10 bg-white dark:bg-zinc-900/20 border-zinc-200 dark:border-white/[0.03] shadow-sm rounded-[2.5rem]">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {MOTIVOS_PARADA.map((m) => (
                      <FormField
                        key={m.id}
                        control={form.control}
                        name={`paradas.${m.id}` as any}
                        render={({ field }) => (
                          <FormItem className="space-y-2 bg-zinc-50 dark:bg-white/[0.01] p-4 rounded-2xl border border-zinc-100 dark:border-white/[0.03]">
                            <FormLabel className="text-[8px] font-black uppercase text-zinc-500 tracking-tighter">{m.nombre}</FormLabel>
                            <FormControl><Input type="number" min={0} value={field.value ?? 0} onChange={field.onChange} className="bg-transparent border-zinc-200 h-10 text-xs font-black" /></FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>

          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full">
               <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 block">Observaciones del Turno</FormLabel>
                    <FormControl><Textarea placeholder="Detalles relevantes..." {...field} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 rounded-3xl min-h-[100px]" /></FormControl>
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-64 bg-brand hover:bg-brand/90 text-black font-black h-20 rounded-2xl shadow-xl transition-all hover:scale-[1.02] uppercase tracking-widest flex flex-col gap-1"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <><Save size={20} /><span>Sincronizar</span></>}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
