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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-zinc-200/5 dark:border-white/[0.04] bg-zinc-100/50 dark:bg-zinc-900/30 p-5 rounded-lg relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-brand">
            <Settings size={12} />
            SISTEMA // PREFERENCIAS
          </div>
          <h1 className="text-base font-black tracking-widest text-foreground uppercase mt-1">
            AJUSTES DEL SISTEMA
          </h1>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-relaxed">
            Configuración global de apariencia, temas visuales y preferencias de interfaz de administración.
          </p>
        </div>
      </header>

      <div className="space-y-12 max-w-2xl">
        {/* SECCIÓN: APARIENCIA */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-[10px] w-4 bg-brand/30" />
            <h2 className="text-[15px] font-black text-muted-foreground uppercase tracking-[0.4em]">Apariencia</h2>
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
                    theme === item.id ? "bg-brand text-white" : "bg-muted text-muted-foreground group-hover:bg-muted/80"
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
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
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
          Settings protocol v1.0.0 // Core Sync
        </p>
      </footer>
    </div>
  );
}
