"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productionFormSchema, type ProductionFormValues } from "@/lib/schemas";
import { 
  Plus, Trash2, Loader2, Save, Clock, Zap, Target, Activity, ShieldAlert,
  CheckCircle2, PauseCircle, StopCircle, Timer, PlayCircle, CheckSquare,
  User, Box
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CatalogItem {
  id: string | number;
  name: string;
}

export function ProductionForm() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalogs, setCatalogs] = useState<{
    machines: CatalogItem[];
    clients: CatalogItem[];
    products: CatalogItem[];
    reasons: { name: string }[];
  }>({ machines: [], clients: [], products: [], reasons: [] });

  const form = useForm<ProductionFormValues>({
    resolver: zodResolver(productionFormSchema),
    defaultValues: {
      machineId: "",
      shift: "",
      clientId: "",
      productId: "",
      date: new Date().toISOString().split("T")[0],
      daysWorked: 0,
      meters: 0,
      velocity: 0,
      wasteML: 0,
      wasteKG: 0,
      jobNumber: "",
      repetition: "",
      approval: "",
      suspension: "",
      machineState: "Listo",
      productionStatus: "pendiente",
      stops: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stops",
  });

  const watchedStops = form.watch("stops") || [];
  const totalDowntime = useMemo(() =>
    watchedStops.reduce((acc, stop) => acc + (Number(stop?.minutes) || 0), 0)
    , [watchedStops]);

  const currentMeters = form.watch("meters") || 0;
  const currentVelocity = form.watch("velocity") || 0;

  useEffect(() => {
    setIsMounted(true);
    async function fetchCatalogs() {
      try {
        const res = await fetch("/api/catalogs");
        if (res.ok) {
          const data = await res.json();
          setCatalogs({
            machines: data?.machines || [],
            clients: data?.clients || [],
            products: data?.products || [],
            reasons: data?.reasons || []
          });
        }
      } catch (error) {
        console.error("Error al cargar catálogos:", error);
      }
    }
    fetchCatalogs();
  }, []);

  async function onSubmit(values: ProductionFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error en el servidor");
      toast.success("Producción registrada exitosamente");
      form.reset();
    } catch (error) {
      toast.error("Error al guardar la producción");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isMounted) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* KPI DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-card border-border p-6 relative overflow-hidden group hover:border-brand/50 transition-all duration-300 shadow-soft">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl -mr-16 -mt-16 group-hover:bg-brand/10 transition-colors" />
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em]">Active_Production</p>
                <h3 className="text-4xl font-black text-foreground font-mono tracking-tighter">
                  {currentMeters.toLocaleString()}
                  <span className="text-xs font-bold text-zinc-600 ml-2 uppercase">Meters</span>
                </h3>
              </div>
              <div className="bg-brand/10 p-3 rounded-2xl text-brand border border-brand/20 group-hover:bg-brand group-hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(184,115,51,0.1)]">
                <Target size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-brand w-2/3 animate-pulse" />
              </div>
              <span className="text-[8px] font-black text-brand uppercase tracking-widest">Running</span>
            </div>
          </Card>

          <Card className="bg-card border-border p-6 relative overflow-hidden group hover:border-zinc-500/50 transition-all duration-300 shadow-soft">
            <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-zinc-500/10 transition-colors" />
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em]">Current_Velocity</p>
                <h3 className="text-4xl font-black text-foreground font-mono tracking-tighter">
                  {currentVelocity}
                  <span className="text-xs font-bold text-zinc-600 ml-2 uppercase">M/Min</span>
                </h3>
              </div>
              <div className="bg-zinc-500/10 p-3 rounded-2xl text-zinc-400 border border-zinc-500/20 group-hover:bg-zinc-500 group-hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(148,163,184,0.1)]">
                <Zap size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-500 w-1/2 animate-pulse" />
              </div>
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Optimized</span>
            </div>
          </Card>

          <Card className="bg-card border-border p-6 relative overflow-hidden group hover:border-red-500/50 transition-all duration-300 shadow-soft">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-red-500/10 transition-colors" />
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em]">Down_Time</p>
                <h3 className="text-4xl font-black text-foreground font-mono tracking-tighter text-red-500/90">
                  {totalDowntime}
                  <span className="text-xs font-bold text-zinc-600 ml-2 uppercase">Min</span>
                </h3>
              </div>
              <div className="bg-red-500/10 p-3 rounded-2xl text-red-500 border border-red-500/20 group-hover:bg-red-500 group-hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <Clock size={24} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-1/4" />
              </div>
              <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Critical</span>
            </div>
          </Card>
        </div>

        {/* SECCIÓN 1: IDENTIFICACIÓN Y ESTADO */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-muted/20 backdrop-blur-sm p-8 rounded-[2.5rem] border border-border shadow-soft">
          <div className="lg:col-span-4 flex items-center gap-4 mb-2">
            <div className="h-[1px] flex-1 bg-zinc-800" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 whitespace-nowrap">Identificación de Orden</h4>
            <div className="h-[1px] flex-1 bg-zinc-800" />
          </div>

          <FormField
            control={form.control}
            name="machineId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Máquina</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background border-border h-12 rounded-xl">
                      <SelectValue placeholder="Seleccionar Máquina" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="NOVOFLEX">NOVOFLEX</SelectItem>
                    <SelectItem value="OLIMPIA">OLIMPIA</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="machineState"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado Máquina</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background border-border h-12 rounded-xl">
                      <SelectValue placeholder="Seleccionar Estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Listo">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <span>Listo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Pausado">
                      <div className="flex items-center gap-2">
                        <PauseCircle size={14} className="text-amber-500" />
                        <span>Pausado</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Cancelado">
                      <div className="flex items-center gap-2">
                        <StopCircle size={14} className="text-red-500" />
                        <span>Cancelado</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productionStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estatus Producción</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background border-border h-12 rounded-xl">
                      <SelectValue placeholder="Estatus" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="pendiente">
                      <div className="flex items-center gap-2">
                        <Timer size={14} className="text-zinc-500" />
                        <span>Pendiente</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="progreso">
                      <div className="flex items-center gap-2">
                        <PlayCircle size={14} className="text-brand" />
                        <span>En Progreso</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="realizado">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={14} className="text-green-500" />
                        <span>Realizado</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="bg-background border-border h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <Input placeholder="Nombre del Cliente" {...field} className="bg-background border-border pl-10 h-12 rounded-xl" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Producto</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                    <Input placeholder="Descripción del Producto" {...field} className="bg-background border-border pl-10 h-12 rounded-xl" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shift"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Turno</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 rounded-xl">
                      <SelectValue placeholder="Turno" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    <SelectItem value="Mañana">Mañana</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                    <SelectItem value="Noche">Noche</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jobNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nro. de Orden</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: OP-2024" {...field} className="bg-background border-border h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* SECCIÓN 2: MÉTRICAS INDUSTRIALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-card border-border p-4 space-y-3 hover:border-brand/30 transition-colors shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rendimiento</p>
              <Activity size={14} className="text-zinc-700" />
            </div>
            <FormField
              control={form.control}
              name="daysWorked"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Días Trabajados</FormLabel>
                  <Input type="number" step="0.1" {...field} className="bg-zinc-900 border-zinc-800 text-lg font-black h-12" />
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <Card className="bg-card border-border p-4 space-y-3 hover:border-brand/30 transition-colors shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Salida</p>
              <Target size={14} className="text-zinc-700" />
            </div>
            <FormField
              control={form.control}
              name="meters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Metros</FormLabel>
                  <Input type="number" {...field} className="bg-zinc-900 border-zinc-800 text-lg font-black h-12 text-brand" />
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <Card className="bg-card border-border p-4 space-y-3 hover:border-brand/30 transition-colors shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Operación</p>
              <Zap size={14} className="text-zinc-700" />
            </div>
            <FormField
              control={form.control}
              name="velocity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Velocidad (M/Min)</FormLabel>
                  <Input type="number" {...field} className="bg-zinc-900 border-zinc-800 text-lg font-black h-12" />
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <Card className="bg-card border-border p-4 space-y-3 hover:border-brand/30 transition-colors shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Merma ML</p>
              <ShieldAlert size={14} className="text-red-900/50" />
            </div>
            <FormField
              control={form.control}
              name="wasteML"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Desperdicio (ML)</FormLabel>
                  <Input type="number" {...field} className="bg-zinc-900 border-zinc-800 text-lg font-black h-12 text-red-500/80" />
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <Card className="bg-card border-border p-4 space-y-3 hover:border-brand/30 transition-colors shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Merma KG</p>
              <ShieldAlert size={14} className="text-red-900/50" />
            </div>
            <FormField
              control={form.control}
              name="wasteKG"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Desperdicio (KG)</FormLabel>
                  <Input type="number" step="0.01" {...field} className="bg-zinc-900 border-zinc-800 text-lg font-black h-12 text-red-500/80" />
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>
        </div>

        {/* SECCIÓN 3: PARADAS */}
        <Card className="bg-muted/5 backdrop-blur-sm border-border shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 mb-6">
            <div>
              <CardTitle className="text-lg">Registro de Paradas</CardTitle>
              <p className="text-sm text-zinc-500">Agrega cada evento de tiempo muerto</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ event: "", minutes: 0 })}
              className="border-brand text-brand hover:bg-brand/10"
            >
              <Plus className="mr-2 h-4 w-4" /> Nueva Parada
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-end bg-background p-4 rounded-xl border border-border animate-in fade-in slide-in-from-top-2">
                <FormField
                  control={form.control}
                  name={`stops.${index}.event`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Razón</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-zinc-900">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {(catalogs.reasons || []).map((r) => (
                            <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`stops.${index}.minutes`}
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel className="text-xs">Minutos</FormLabel>
                      <Input type="number" {...field} className="bg-zinc-900" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="text-zinc-600 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {fields.length === 0 && (
              <div className="text-center py-8 text-zinc-600 border-2 border-dashed border-zinc-800 rounded-xl italic">
                No hay paradas registradas en este turno
              </div>
            )}
          </CardContent>
        </Card>

        {/* ACCIONES FINALES */}
        <div className="flex justify-between items-center pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => { if (confirm("¿Limpiar todo?")) form.reset(); }}
            className="text-zinc-500 hover:text-zinc-300"
          >
            Resetear Formulario
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand hover:bg-brand-dark text-black font-bold px-10 py-6 h-auto text-lg rounded-2xl shadow-lg shadow-brand/20"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
            Guardar Reporte
          </Button>
        </div>
      </form>
    </Form>
  );
}
