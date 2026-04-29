"use client";

import { useTheme } from "@/components/theme-provider";
import { 
  Settings, 
  Moon, 
  Sun, 
  Palette, 
  Check, 
  Layout, 
  ShieldCheck,
  Monitor
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme, brandColor, setBrandColor, colors } = useTheme();

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* MODO DE APARIENCIA */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Layout size={16} className="text-brand" />
            <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Apariencia</h2>
          </div>
          
          <Card className="bg-card border-border overflow-hidden shadow-soft">
            <CardHeader className="bg-muted/30 border-b border-border p-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Modo de Interfaz</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex-1 h-24 flex flex-col items-center justify-center gap-3 rounded-2xl transition-all duration-300",
                    theme === "dark" 
                      ? "bg-brand text-black shadow-[0_0_20px_rgba(184,115,51,0.2)]" 
                      : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:bg-zinc-800"
                  )}
                >
                  <Moon size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Oscuro</span>
                </Button>
                <Button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex-1 h-24 flex flex-col items-center justify-center gap-3 rounded-2xl transition-all duration-300",
                    theme === "light" 
                      ? "bg-brand text-black shadow-[0_0_20px_rgba(184,115,51,0.2)]" 
                      : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:bg-zinc-800"
                  )}
                >
                  <Sun size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Claro</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* COLORES DE MARCA */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Palette size={16} className="text-brand" />
            <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Identidad Visual</h2>
          </div>

          <Card className="bg-card border-border overflow-hidden shadow-soft">
            <CardHeader className="bg-muted/30 border-b border-border p-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Color Secundario (Brand)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {colors.map((c) => (
                  <Button
                    key={c.name}
                    onClick={() => setBrandColor(c.hsl)}
                    className={cn(
                      "h-12 flex items-center justify-between px-4 rounded-xl transition-all duration-300 border border-zinc-900",
                      brandColor === c.hsl ? "ring-2 ring-brand ring-offset-4 ring-offset-black" : ""
                    )}
                    style={{ backgroundColor: `hsl(${c.hsl})` }}
                  >
                    <span className="text-[9px] font-black uppercase text-black/80 drop-shadow-sm">{c.name}</span>
                    {brandColor === c.hsl && <Check size={14} className="text-black" strokeWidth={3} />}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
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
