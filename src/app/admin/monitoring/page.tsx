"use client";

import { useState, useEffect } from "react";
import { Activity, Monitor, Radio, RefreshCw, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MACHINES = [
  { id: "NOVOFLEX", port: 3001, label: "Console_01" },
  { id: "OLYMPIA", port: 3001, label: "Console_02" }
];

export default function MonitoringPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [key, setKey] = useState(0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setKey(prev => prev + 1);
      setIsRefreshing(false);
    }, 1500);
  };

  return (
    <div className="space-y-10">
      {/* Header Estilo CUREX */}
      <header className="flex flex-col gap-4 border-b border-border pb-8">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          <Activity size={12} className="text-brand animate-pulse" />
          Network Monitoring Node
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-foreground">
          CENTER <span className="text-brand">CONTROL</span>
        </h1>
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
          Sincronización en tiempo real con terminales de planta
        </p>
      </header>

      {/* Grid de Monitores Simulados */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {MACHINES.map((m) => (
          <div key={m.id} className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                  Terminal: {m.id} // {m.label}
                </span>
              </div>
              <span className="text-[10px] font-mono text-foreground opacity-70">
                192.168.1.{m.port === 3001 ? "10" : "11"}:{m.port}
              </span>
            </div>

            {/* Simulación de TV Industrial */}
            <div className="relative group">
              {/* Bezel / Marco de la TV - Siempre oscuro para realismo */}
              <div className="relative bg-black p-4 rounded-[2rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] border-t border-zinc-800 transition-transform duration-500 group-hover:scale-[1.01]">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                </div>
                
                {/* Pantalla (Iframe con Escala Fija 1080p) - Configuración Original */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-zinc-950 shadow-inner" style={{ containerType: 'inline-size' }}>
                  <div className="absolute top-0 left-0 w-[1920px] h-[1080px] pointer-events-none origin-top-left" 
                       style={{ transform: "scale(calc(100cqw / 1920))" }}>
                    <iframe
                      key={`${m.id}-${key}`}
                      src={`http://localhost:${m.port}/?machine=${m.id}`}
                      className="w-full h-full border-none bg-[#0B0C10]"
                    />
                  </div>

                  <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                        <span className="text-[10px] font-black uppercase text-white tracking-widest">Responsive 1080p Viewport</span>
                     </div>
                  </div>

                  {/* Efecto de Scanlines / Grano Industrial */}
                  <div className="absolute inset-0 z-10 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
                  
                  {/* Simulated Glass Reflection */}
                  <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-10" />
                </div>
              </div>
              {/* Stand base subtle - Más oscuro */}
              <div className="w-1/4 h-1.5 bg-zinc-950 mx-auto rounded-b-xl opacity-80 mt-[-1px]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card border-border p-4 flex items-center justify-between group shadow-soft">
                <div className="space-y-1">
                  <p className="text-[8px] text-muted-foreground font-bold uppercase">Signal Quality</p>
                  <p className="text-[10px] text-foreground font-black uppercase">99.8% Nominal</p>
                </div>
                <Radio size={14} className="text-muted-foreground" />
              </Card>
              <a href={`http://localhost:${m.port}/?machine=${m.id}`} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full h-full border-border bg-card/50 backdrop-blur-sm hover:bg-muted/50 flex items-center justify-center gap-2 rounded-xl group py-4 transition-all">
                  <ExternalLink size={14} className="text-muted-foreground group-hover:text-brand" />
                  <span className="text-[8px] font-black text-muted-foreground group-hover:text-brand uppercase tracking-widest">Open Full</span>
                </Button>
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-border">
        <Card className="bg-card border-border p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-soft">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Protocolo de Red</span>
              <span className="text-xs font-black text-foreground italic">CUREX_HYPERLINK_v4.0</span>
            </div>
            <div className="w-[1px] h-8 bg-border" />
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Latencia Global</span>
              <span className="text-xs font-black text-green-500">0.14 ms (Real-time)</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={handleRefresh}
              variant="outline" 
              className="border-border text-muted-foreground hover:text-brand hover:border-brand/50 hover:bg-brand/5 font-black uppercase tracking-widest h-10 rounded-xl transition-all"
            >
              <RefreshCw size={14} className={cn("mr-2", isRefreshing && "animate-spin")} />
              Recalibrar Puentes
            </Button>
            <div className="px-4 py-2 bg-brand/10 border border-brand/20 rounded-xl">
               <span className="text-[9px] font-black text-brand uppercase tracking-widest">Dual_Sync Active</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
