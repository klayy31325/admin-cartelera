"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { velocidadFormSchema, type VelocidadFormValues } from "@/lib/schemas";
import { Zap, Calendar, Clock, Save, Loader2 } from "lucide-react";
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
import { API_BASE_URL } from "@/lib/api-config";

export function VelocidadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<VelocidadFormValues>({
    resolver: zodResolver(velocidadFormSchema),
    defaultValues: {
      maquina_id: 1,
      fecha: today,
      turno: "A",
      velocidad_teorica_mlmin: 0,
      velocidad_real_mlmin: 0,
      observaciones: "",
    },
  });

  async function onSubmit(values: VelocidadFormValues) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("curex_token");
      const res = await fetch(`${API_BASE_URL}/velocidad`, {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Error al registrar");

      toast.success("Velocidad registrada exitosamente");
      form.reset({ ...form.getValues(), velocidad_teorica_mlmin: 0, velocidad_real_mlmin: 0, observaciones: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  }

  const teorica = form.watch("velocidad_teorica_mlmin");
  const real    = form.watch("velocidad_real_mlmin");
  const rendimiento = teorica > 0 ? ((real / teorica) * 100).toFixed(1) : "—";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-muted/20 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] border border-border shadow-soft space-y-8">

          <div className="flex items-center gap-3">
            <Zap className="text-brand" size={18} />
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-foreground">REGISTRO DE VELOCIDAD DE MÁQUINA</h4>
            <div className="h-[1px] flex-1 bg-zinc-800" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

            {/* Máquina */}
            <FormField
              control={form.control}
              name="maquina_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Máquina</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-border h-11 rounded-xl text-base font-bold">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="1">OLYMPIA</SelectItem>
                      <SelectItem value="2">NOVOFLEX</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Turno */}
            <FormField
              control={form.control}
              name="turno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Turno</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-border h-11 rounded-xl text-base font-bold">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="A">TURNO A</SelectItem>
                      <SelectItem value="B">TURNO B</SelectItem>
                      <SelectItem value="C">TURNO C</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha */}
            <FormField
              control={form.control}
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fecha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <Input type="date" {...field}
                        className="bg-background border-border pl-10 h-11 rounded-xl text-base font-bold" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rendimiento calculado */}
            <div className="flex items-end">
              <div className="w-full space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Rendimiento — Calculado</label>
                <div className={`h-11 rounded-xl px-4 flex items-center font-black text-lg border ${
                  Number(rendimiento) >= 85 ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : Number(rendimiento) >= 60 ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500"
                }`}>
                  {rendimiento}%
                </div>
              </div>
            </div>

            {/* Velocidad Teórica */}
            <FormField
              control={form.control}
              name="velocidad_teorica_mlmin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Velocidad Teórica (m/min)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <Input type="number" step="0.01" placeholder="0.00" {...field}
                        className="bg-background border-border pl-10 h-11 rounded-xl text-base font-bold" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Velocidad Real */}
            <FormField
              control={form.control}
              name="velocidad_real_mlmin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Velocidad Real (m/min)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                      <Input type="number" step="0.01" placeholder="0.00" {...field}
                        className="bg-background border-border pl-10 h-11 rounded-xl text-base font-bold" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Observaciones */}
          <FormField
            control={form.control}
            name="observaciones"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Observaciones</FormLabel>
                <FormControl>
                  <Textarea placeholder="Condiciones de operación, notas del operario..."
                    {...field} className="bg-background border-border rounded-xl text-base font-bold min-h-[80px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-4 border-t border-zinc-900">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand hover:bg-brand/90 text-black font-black px-10 h-12 text-[15px] rounded-xl shadow-2xl shadow-brand/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save className="mr-2" size={20} />}
              REGISTRAR VELOCIDAD
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
