"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api-config";
import Image from "next/image";
import { Lock, User, Terminal as TerminalIcon, Loader2, Mail, Building, Briefcase, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";

const ROLES_OPTIONS = [
  { value: "admin", label: "Administrador" },
  { value: "editor", label: "Editor" },
  { value: "operador", label: "Operador (Carga Excel)" },
  { value: "visor", label: "Visualizador" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [isLoginView, setIsLoginView] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    password: "",
    empresa: "",
    departamento: "",
    rol: "",
  });

  const backgrounds = ["/OLYMPIA.png", "/novoflex.png"];

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 40000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isLoginView) {
        // Lógica de Login
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            correo: formData.correo,
            password: formData.password,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || "Credenciales incorrectas");
        }

        // Guardar token y redirigir según rol
        login(data.data.token, data.data.usuario);
        const roleRedirects: Record<string, string> = {
          admin: "/admin",
          editor: "/admin/production",
          operador: "/admin/production",
          visor: "/admin",
        };
        router.push(roleRedirects[data.data.usuario.rol] || "/admin/production");

      } else {
        // Lógica de Registro
        const res = await fetch(`${API_BASE_URL}/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || "Error al registrar usuario");
        }

        setSuccessMsg("Usuario registrado con éxito. Ahora inicia sesión.");
        setIsLoginView(true);
        setFormData({ ...formData, password: "" }); // limpiar contraseña
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
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

          <form onSubmit={handleSubmit} className="space-y-6">

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg text-[11px] text-red-200 text-center font-bold">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/50 p-3 rounded-lg text-[11px] text-green-200 text-center font-bold">
                {successMsg}
              </div>
            )}

            <div className="space-y-4">
              {!isLoginView && (
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">NOMBRE</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-zinc-600" size={18} />
                      <Input
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required={!isLoginView}
                        placeholder="John"
                        className="bg-white/10 border-white/10 pl-10 h-12 text-white focus:border-brand/50 focus:bg-white/15 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">APELLIDO</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-zinc-600" size={18} />
                      <Input
                        name="apellido"
                        value={formData.apellido}
                        onChange={handleChange}
                        required={!isLoginView}
                        placeholder="Doe"
                        className="bg-white/10 border-white/10 pl-10 h-12 text-white focus:border-brand/50 focus:bg-white/15 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isLoginView && (
                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">EMPRESA</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 text-zinc-600" size={18} />
                      <select
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        required={!isLoginView}
                        className="flex h-12 w-full rounded-md border border-white/10 bg-white/10 pl-10 pr-4 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:border-brand/50 focus:bg-white/15 transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                      >
                        <option value="" disabled className="bg-zinc-900">Seleccionar Empresa</option>
                        <option value="MORROCEL C.A" className="bg-zinc-900 text-white">MORROCEL C.A</option>
                        <option value="CUREX C.A" className="bg-zinc-900 text-white">CUREX C.A</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">DEPARTAMENTO</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 text-zinc-600" size={18} />
                      <Input
                        name="departamento"
                        value={formData.departamento}
                        onChange={handleChange}
                        required={!isLoginView}
                        placeholder="Producción"
                        className="bg-white/10 border-white/10 pl-10 h-12 text-white focus:border-brand/50 focus:bg-white/15 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isLoginView && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">ROL DE ACCESO</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-3 text-zinc-600" size={18} />
                    <select
                      name="rol"
                      value={formData.rol}
                      onChange={handleChange}
                      required={!isLoginView}
                      className="flex h-12 w-full rounded-md border border-white/10 bg-white/10 pl-10 pr-4 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:border-brand/50 focus:bg-white/15 transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                    >
                      <option value="" disabled className="bg-zinc-900">Seleccionar Rol</option>
                      {ROLES_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value} className="bg-zinc-900 text-white">{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">CORREO EMAIL</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-zinc-600" size={18} />
                  <Input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    required
                    placeholder="admin@curex.com"
                    className="bg-white/10 border-white/10 pl-10 h-12 text-white focus:border-brand/50 focus:bg-white/15 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest ml-1">PASSWORD</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-zinc-600" size={18} />
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="bg-white/10 border-white/10 pl-10 h-12 text-white focus:border-brand/50 focus:bg-white/15 transition-all"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-600 hover:bg-zinc-700 text-white font-black text-sm uppercase tracking-widest h-14 rounded-xl shadow-[0_0_20px_rgba(82,82,91,0.2)] hover:shadow-[0_0_30px_rgba(82,82,91,0.4)] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLoginView ? "INICIAR SESIÓN" : "REGISTRAR ACCESO"}
                  <TerminalIcon size={18} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-900/50 flex flex-col justify-center items-center text-[9px] text-zinc-400 font-bold uppercase tracking-tighter gap-3">
            <button
              type="button"
              onClick={() => {
                setIsLoginView(!isLoginView);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="hover:text-brand transition-colors border-b border-transparent hover:border-brand pb-0.5"
            >
              {isLoginView ? "¿No tienes cuenta? Solicita acceso al sistema" : "¿Ya tienes credenciales? Inicia sesión"}
            </button>
            <div className="flex gap-4 opacity-50 mt-2">
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                AYUDA
              </span>
              <span>SOPORTE</span>
            </div>
          </div>
        </Card>

        <p className="mt-8 text-center text-[10px] text-zinc-700 font-bold uppercase tracking-[0.2em]">
          SYSTEM CLASSIFIED // MORROCEL C.A - CUREX C.A.
        </p>
      </div>
    </main>
  );
}
