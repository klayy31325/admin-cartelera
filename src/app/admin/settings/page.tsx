"use client";

import { useTheme } from "@/components/theme-provider";
import { 
  Settings, 
  Moon, 
  Sun, 
  Check, 
  ShieldCheck,
  Monitor
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-10 max-w-4xl">
      {/* Header Estilo CUREX */}
      <header className="flex flex-col gap-4 border-b border-border pb-8">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
          <Settings size={12} className="text-brand animate-spin-slow" />
          System Configuration v1.0
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-foreground">
          SETTINGS <span className="text-brand">PANEL</span>
        </h1>
        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
          Personaliza la experiencia visual y los parámetros del sistema
        </p>
      </header>

      <div className="space-y-12 max-w-2xl">
        {/* SECCIÓN: APARIENCIA */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-[1px] w-4 bg-brand/30" />
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Apariencia</h2>
          </div>
          
          <div className="space-y-1">
            {[
              { id: 'dark', label: 'Modo Oscuro', icon: Moon, desc: 'Interfaz optimizada para entornos industriales con poca luz' },
              { id: 'light', label: 'Modo Claro', icon: Sun, desc: 'Alta legibilidad para entornos de oficina con luz natural' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTheme(item.id as any)}
                className={cn(
                  "w-full group flex items-center justify-between p-4 rounded-xl transition-all duration-200 border border-transparent",
                  theme === item.id 
                    ? "bg-brand/5 border-brand/20 shadow-inner" 
                    : "hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    theme === item.id ? "bg-brand text-black" : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                  )}>
                    <item.icon size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <p className={cn("text-[11px] font-black uppercase tracking-widest", theme === item.id ? "text-brand" : "text-foreground")}>
                      {item.label}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight opacity-60">
                      {item.desc}
                    </p>
                  </div>
                </div>
                {theme === item.id && (
                  <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shadow-[0_0_10px_rgba(184,115,51,0.3)]">
                    <Check size={12} className="text-black" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* NOTA DE TEMA AUTOMÁTICO */}
        <section className="p-6 rounded-2xl bg-brand/5 border border-brand/10 border-dashed">
          <div className="flex gap-4">
             <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand shrink-0">
               <ShieldCheck size={20} />
             </div>
             <div className="space-y-1">
               <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground">Identidad Corporativa Protegida</h4>
               <p className="text-[10px] text-muted-foreground uppercase leading-relaxed font-bold tracking-tight opacity-70">
                 Los colores de la marca se configuran automáticamente según tu empresa registrada (CUREX o MORROCEL). No se requiere configuración manual.
               </p>
             </div>
          </div>
        </section>
      </div>

      {/* SEGURIDAD Y ESTADO */}
      <footer className="pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border shadow-soft">
             <ShieldCheck size={16} className="text-green-500" />
             <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Encryption: Active</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm rounded-xl border border-border shadow-soft">
             <Monitor size={16} className="text-brand" />
             <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Admin Node: Secured</span>
          </div>
        </div>

        <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.3em]">
          Settings protocol v1.4.2 // Core Sync
        </p>
      </footer>
    </div>
  );
}
