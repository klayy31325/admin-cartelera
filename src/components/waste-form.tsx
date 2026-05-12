"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { wasteFormSchema, type WasteFormValues } from "@/lib/schemas";
import {
  Trash2, Monitor, Scale, Droplets, MessageSquare, Loader2, Save
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
import { Textarea } from "@/components/ui/textarea";

interface Machine {
  id: number;
  name: string;
}

export function WasteForm() {
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoadingMachines, setIsLoadingMachines] = useState(true);

  const form = useForm<WasteFormValues>({
    resolver: zodResolver(wasteFormSchema),
    defaultValues: {
      maquina_id: 0,
      cantidad_kg: 0,
      cantidad_ml: 0,
      comentario: "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
    fetchMachines();
  }, []);

  async function fetchMachines() {
    try {
      const token = localStorage.getItem("curex_token");
      const res = await fetch("http://localhost:8000/api/catalogos", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMachines(data.data.machines);
      }
    } catch (error) {
      console.error("Error al cargar máquinas:", error);
    } finally {
      setIsLoadingMachines(false);
    }
  }

  async function onSubmit(values: WasteFormValues) {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("curex_token");
      const res = await fetch("http://localhost:8000/api/desperdicios", {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Error al registrar el desperdicio");

      toast.success("Desperdicio registrado exitosamente");
      form.reset();
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
        <div className="bg-zinc-900/50 backdrop-blur-sm p-6 md:p-8 rounded-[2rem] border border-zinc-800 shadow-soft space-y-8">
          
          <div className="flex items-center gap-3">
            <Trash2 className="text-brand" size={18} />
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-foreground">REGISTRO DE DESPERDICIO GENERAL</h4>
            <div className="h-[1px] flex-1 bg-zinc-800" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
            {/* Máquina */}
            <FormField
              control={form.control}
              name="maquina_id"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Monitor size={14} /> Máquina
                  </FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(parseInt(val))} 
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background border-zinc-800 h-11 rounded-xl text-base font-bold hover:border-brand/50 transition-all">
                        <SelectValue placeholder={isLoadingMachines ? "Cargando..." : "Seleccionar máquina"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-zinc-800">
                      {machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id.toString()}>
                          {machine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cantidad KG */}
            <FormField
              control={form.control}
              name="cantidad_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Scale size={14} /> Cantidad (KG)
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        className="bg-background border-zinc-800 h-11 rounded-xl text-base font-bold appearance-none hover:border-brand/50 transition-all focus-visible:ring-brand/20"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cantidad ML */}
            <FormField
              control={form.control}
              name="cantidad_ml"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Droplets size={14} /> Cantidad (ML)
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        className="bg-background border-zinc-800 h-11 rounded-xl text-base font-bold appearance-none hover:border-brand/50 transition-all focus-visible:ring-brand/20"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Comentario */}
          <FormField
            control={form.control}
            name="comentario"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <MessageSquare size={14} /> Observaciones / Comentario
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detalles adicionales sobre el desperdicio..."
                    {...field}
                    className="bg-background border-zinc-800 rounded-xl text-base font-bold min-h-[100px] hover:border-brand/50 transition-all focus-visible:ring-brand/20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col md:flex-row justify-end items-center gap-4 pt-8 border-t border-zinc-800 mt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto bg-brand hover:bg-brand/90 text-black font-black px-10 h-12 text-[15px] rounded-xl shadow-2xl shadow-brand/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : (
                <Save className="mr-2" size={20} />
              )}
              REGISTRAR DESPERDICIO
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
