"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-config";
import { Lock, Terminal as TerminalIcon, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import ShaderBackground from "@/components/shader-background";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Credenciales incorrectas");
      }

      login(data.data.token, data.data.usuario);
      const roleRedirects: Record<string, string> = {
        admin: "/admin",
        editor: "/admin/production",
        operador: "/admin/production",
        visor: "/admin",
      };
      router.push(roleRedirects[data.data.usuario.rol] || "/admin/production");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Ocurrió un error inesperado.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ShaderBackground />

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tighter text-white mb-1 uppercase">
            Cartelera <span className="text-brand"> Digital</span>
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-100 font-bold">
            Control y gestión de estadísticas industriales
          </p>
        </div>

        <Card className="bg-white/10 border-white/20 p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-brand/20 shadow-[0_0_15px_rgba(184,115,51,0.5)]" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div aria-live="polite">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg text-xs text-red-200 text-center font-bold mb-4">
                  {errorMsg}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="correo" className="text-xs uppercase font-bold text-zinc-100 tracking-widest ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-zinc-500" size={18} />
                  <Input
                    id="correo"
                    type="email"
                    name="correo"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    placeholder="usuario@curex.com"
                    className="bg-white/5 border-white/10 pl-10 h-12 text-white placeholder:text-zinc-500 focus:border-brand/50 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-xs uppercase font-bold text-zinc-100 tracking-widest ml-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-zinc-500" size={18} />
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 pl-10 h-12 text-white placeholder:text-zinc-500 focus:border-brand/50 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black text-sm uppercase tracking-widest h-14 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  INICIAR SESIÓN
                  <TerminalIcon size={18} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col justify-center items-center gap-3">
            <div className="flex gap-4 opacity-70 mt-2">
              <span className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                AYUDA
              </span>
              <span className="cursor-pointer hover:text-white transition-colors">SOPORTE</span>
            </div>
          </div>
        </Card>

        <p className="mt-8 text-center text-lg text-zinc-100 font-bold uppercase tracking-[0.2em]">
          SISTEMA CLASIFICADO<br />
          <span className="text-zinc-300">CUREX C.A.</span>
        </p>
      </div>
    </main>
  );
}