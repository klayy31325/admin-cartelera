"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, User, ShieldCheck, Terminal as TerminalIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const backgrounds = ["/olimpia.png", "/novoflex.png"];

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 40000); // Cambia cada 40 segundos
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulación de autorización técnica
    setTimeout(() => {
      router.push("/admin/production");
    }, 1500);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 z-0">
        {backgrounds.map((bg, index) => (
          <div
            key={bg}
            className="absolute inset-0 will-change-opacity"
            style={{
              opacity: index === bgIndex ? 1 : 0,
              transition: "opacity 20s ease-in-out",
            }}
          >
            <Image
              src={bg}
              alt={`Industrial Background ${index}`}
              fill
              priority
              className="object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/70 backdrop-brightness-[0.3]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
        {/* Header de CARTELERA DIGITAL */}
        <div className="flex flex-col items-center mb-8 text-center">

          <h1 className="text-4xl font-black tracking-tighter text-white mb-1 uppercase">
            CARTELERA <span className="text-brand"> DIGITAL</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">
            CONTROL Y GESTION DE ESTADISTICAS INDUSTRIALES
          </p>
        </div>

        <Card className="bg-white/10 border-white/20 p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
          {/* Línea de escaneo decorativa */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-brand/20 shadow-[0_0_15px_rgba(184,115,51,0.5)]" />

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">USER</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-zinc-600" size={18} />
                  <Input
                    placeholder="ADMIN_USER"
                    className="bg-white/10 border-white/10 pl-10 h-12 text-white focus:border-brand/50 focus:bg-white/15 transition-all"
                    defaultValue="admin"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">PASSWORD</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-zinc-600" size={18} />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="bg-white/10 border-white/10 pl-10 h-12 text-white focus:border-brand/50 focus:bg-white/15 transition-all"
                    defaultValue="password"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand hover:bg-brand-dark text-black font-black text-sm uppercase tracking-widest h-14 rounded-xl shadow-[0_0_20px_rgba(184,115,51,0.2)] hover:shadow-[0_0_30px_rgba(184,115,51,0.4)] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>

                  <TerminalIcon size={18} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-900 flex justify-between items-center text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              AYUDA
            </span>
            <span>SOPORTE</span>
          </div>
        </Card>

        <p className="mt-8 text-center text-[10px] text-zinc-700 font-bold uppercase tracking-[0.2em]">
          SYSTEM CLASSIFIED // MORROCEL C.A - CUREX C.A.
        </p>
      </div>
    </main>
  );
}
