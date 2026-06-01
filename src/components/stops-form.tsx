"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stopsFormSchema, type StopsFormValues } from "@/lib/schemas";
import {
  Clock, Calendar, AlertTriangle, MessageSquare, ListFilter, Loader2, Save
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
import { API_BASE_URL } from "@/lib/api-config";

export function StopsForm() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCompany, setUserCompany] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<StopsFormValues>({
    resolver: zodResolver(stopsFormSchema),
    defaultValues: {
      maquina_nombre: "",
      motivo_nombre: "",
      fecha: today,
      hora_inicio: "08:00",
      hora_fin: "08:30",
      tipo: "no_programada",
      comentario: "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("curex_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserCompany(payload.empresa);
      } catch (e) {
        console.error("Error al decodificar token:", e);
      }
    }
  }, []);

  async function onSubmit(values: StopsFormValues) {
    setIsSubmitting(true);
    try {
      // input type="time" ya viene en formato HH:MM (24h)
      const fecha_inicio = `${values.fecha} ${values.hora_inicio}:00`;
      const fecha_fin = `${values.fecha} ${values.hora_fin}:00`;

      const token = localStorage.getItem("curex_token");
      const res = await fetch(`${API_BASE_URL}/paradas`, {
        method: "POST",
        body: JSON.stringify({
          ...values,
          fecha_inicio,
          fecha_fin
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Error al registrar la parada");

      toast.success("Parada registrada exitosamente");
      form.reset({
        ...form.getValues(),
        motivo_nombre: "",
        comentario: ""
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al guardar";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isMounted) return <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-brand" /></div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-muted/20 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] border border-border shadow-soft space-y-8">

          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-500" size={18} />
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-foreground">REPORTE DE INCIDENCIA</h4>
            <div className="h-[1px] flex-1 bg-zinc-800" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
            {/* Máquina y Motivo */}
            <div className="space-y-6">
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
                name="motivo_nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Motivo de Parada</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <Input
                          placeholder="Ej: Falla Eléctrica..."
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
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tipo de Parada</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-border h-11 rounded-xl text-base font-bold">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="programada">PROGRAMADA</SelectItem>
                        <SelectItem value="no_programada">NO PROGRAMADA</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fecha y Tiempos */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Día del Evento</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <Input
                          type="date"
                          {...field}
                          className="bg-background border-border pl-10 h-11 rounded-xl text-base font-bold"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Inicio */}
                <FormField
                  control={form.control}
                  name="hora_inicio"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Inicio (Desde)</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand transition-colors" size={16} />
                          <Input
                            type="time"
                            {...field}
                            className="bg-background border-border pl-10 h-11 rounded-xl text-base font-bold appearance-none cursor-pointer hover:border-brand/40 transition-all focus-visible:ring-brand/20"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fin */}
                <FormField
                  control={form.control}
                  name="hora_fin"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fin (Hasta)</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand transition-colors" size={16} />
                          <Input
                            type="time"
                            {...field}
                            className="bg-background border-border pl-10 h-11 rounded-xl text-base font-bold appearance-none cursor-pointer hover:border-brand/40 transition-all focus-visible:ring-brand/20"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="comentario"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Comentario / Detalles Técnicos</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 text-zinc-600" size={16} />
                    <Input
                      placeholder="Describa brevemente la causa de la parada..."
                      {...field}
                      className="bg-background border-border pl-10 h-11 rounded-xl text-base font-bold"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col md:flex-row justify-end items-center gap-4 pt-8 border-t border-zinc-900/50 mt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-black px-10 h-12 text-[15px] rounded-xl shadow-2xl shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : (
                <Save className="mr-2" size={20} />
              )}
              REGISTRAR PARADA
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
