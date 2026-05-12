"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productionFormSchema, type ProductionFormValues } from "@/lib/schemas";
import { ExcelImport } from "@/components/excel-import";
import {
  Loader2, Save, Target, Activity, CheckCircle2, PauseCircle,
  StopCircle, Timer, PlayCircle, CheckSquare, User, Box, Monitor
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
import { Card } from "@/components/ui/card";

interface CatalogItem {
  id: string | number;
  name: string;
}

export function ProductionForm() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalogs, setCatalogs] = useState<{
    machines: CatalogItem[];
  }>({ machines: [] });

  const [userCompany, setUserCompany] = useState<string | null>(null);

  const form = useForm<ProductionFormValues>({
    resolver: zodResolver(productionFormSchema),
    defaultValues: {
      maquina_nombre: "",
      maquina_estado: "Listo",
      cliente: "",
      producto: "",
      metros: 0,
      fecha: new Date().toISOString().split("T")[0],
      status_orden: "pendiente",
    },
  });

  const currentMeters = form.watch("metros") || 0;

  useEffect(() => {
    setIsMounted(true);

    // Obtener info del usuario desde el token
    const token = localStorage.getItem("curex_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const company = payload.empresa; // "MORROCEL C.A" o "CUREX C.A"
        setUserCompany(company);

        // Ya no autoseleccionamos máquinas para permitir que el usuario escoja manualmente
      } catch (e) {
        console.error("Error al decodificar token:", e);
      }
    }

    async function fetchCatalogs() {
      try {
        const res = await fetch("http://localhost:8000/api/catalogos", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const result = await res.json();
          const data = result.data;
          setCatalogs({
            machines: data?.machines || [],
          });
        }
      } catch (error) {
        console.error("Error al cargar catálogos:", error);
      }
    }
    fetchCatalogs();
  }, [form]);

  async function onSubmit(values: ProductionFormValues) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("curex_token");
      const res = await fetch("http://localhost:8000/api/produccion", {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Error en el servidor");
      toast.success("Producción registrada exitosamente");
      form.reset({
        ...form.getValues(),
        cliente: "",
        producto: "",
        metros: 0,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al guardar la producción";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isMounted) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">

        {/* FORMULARIO SIMPLIFICADO */}
        <div className="bg-muted/20 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] border border-border shadow-soft space-y-8">

          <div className="flex items-center gap-3">
            <Monitor className="text-brand" size={18} />
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-foreground">PRODUCCION</h4>
            <div className="h-[1px] flex-1 bg-zinc-800" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="maquina_nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Máquina</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-border h-11 rounded-xl text-base font-bold">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border">
                      {(!userCompany || userCompany === "CUREX C.A") && (
                        <>
                          <SelectItem value="NOVOFLEX">NOVOFLEX</SelectItem>
                          <SelectItem value="OLYMPIA">OLYMPIA</SelectItem>
                        </>
                      )}
                      {(!userCompany || userCompany === "MORROCEL C.A") && (
                        <SelectItem value="OLYMPIA">OLYMPIA</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maquina_estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Estado de Operación</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-border h-11 rounded-xl text-base font-bold">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="Listo">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-500" />
                          <span className="text-sm">Listo / Operando</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Pausado">
                        <div className="flex items-center gap-2">
                          <PauseCircle size={16} className="text-amber-500" />
                          <span className="text-sm">Pausado / Espera</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Cancelado">
                        <div className="flex items-center gap-2">
                          <StopCircle size={16} className="text-red-500" />
                          <span className="text-sm">Cancelado / Error</span>
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
              name="status_orden"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Estatus de Orden</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-border h-11 rounded-xl text-base font-bold">
                        <SelectValue placeholder="Estatus" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="pendiente">
                        <div className="flex items-center gap-2">
                          <Timer size={16} className="text-zinc-500" />
                          <span className="text-sm">Pendiente</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="progreso">
                        <div className="flex items-center gap-2">
                          <PlayCircle size={16} className="text-brand" />
                          <span className="text-sm">En Progreso</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="listo">
                        <div className="flex items-center gap-2">
                          <CheckSquare size={16} className="text-green-500" />
                          <span className="text-sm">Listo</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cliente</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <Input
                        placeholder="Nombre del Cliente"
                        {...field}
                        className="bg-background border-border pl-10 h-11 rounded-xl text-base font-bold"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="producto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Producto</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <Input
                        placeholder="Descripción del Producto"
                        {...field}
                        className="bg-background border-border pl-10 h-11 rounded-xl text-base font-bold"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metros"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cantidad de Metros</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        className="bg-background border-border pl-10 h-11 rounded-xl text-lg font-black text-brand"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fecha de Reporte</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      className="bg-background border-border h-11 rounded-xl text-base font-bold"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* ACCIONES FINALES - Integradas Dentro de la Card */}
          <div className="flex flex-col md:flex-row justify-end items-center gap-4 pt-8 border-t border-zinc-900/50 mt-4">
            <div className="w-full md:w-auto">
              <ExcelImport />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto bg-brand hover:bg-brand-dark text-black font-black px-10 h-12 text-[15px] rounded-xl shadow-2xl shadow-brand/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : (
                <Save className="mr-2" size={20} />
              )}
              GUARDAR REGISTRO
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
