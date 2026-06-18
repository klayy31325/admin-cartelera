"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api-config";
import { useAuth } from "@/components/auth-provider";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building,
  Briefcase,
  Mail,
  Lock,
  User as UserIcon,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLES_OPTIONS = [
  { value: "admin", label: "Administrador" },
  { value: "editor", label: "Editor" },
  { value: "operador", label: "Operador (Carga Excel)" },
  { value: "visor", label: "Visualizador" },
];

const INITIAL_FORM = {
  nombre: "",
  apellido: "",
  correo: "",
  password: "",
  empresa: "",
  departamento: "",
  rol: "visor",
};

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  empresa: string;
  departamento: string;
  rol: string;
  activo: boolean;
}

export default function UsuariosPage() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios`, { headers });
      const data = await res.json();
      if (data.success) setUsuarios(data.data);
    } catch {
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE_URL}/usuarios`, {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Error al crear usuario");
      }

      setSuccess(`Usuario ${form.nombre} ${form.apellido} creado exitosamente`);
      setForm(INITIAL_FORM);
      fetchUsuarios();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Error inesperado");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    setDeleting(id);

    try {
      const res = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Error al eliminar");
      }

      setSuccess("Usuario eliminado");
      fetchUsuarios();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Error inesperado");
    } finally {
      setDeleting(null);
    }
  };

  const roleLabel = (rol: string) =>
    ROLES_OPTIONS.find((r) => r.value === rol)?.label || rol;

  return (
    <div className="space-y-10 max-w-6xl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-zinc-200/5 dark:border-white/[0.04] bg-zinc-100/50 dark:bg-zinc-900/30 p-5 rounded-lg relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-brand">
            <Users size={12} />
            SISTEMA // SEGURIDAD
          </div>
          <h1 className="text-base font-black tracking-widest text-foreground uppercase mt-1">
            GESTIÓN DE USUARIOS
          </h1>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-relaxed">
            Administración de cuentas, roles y permisos del sistema
          </p>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-xs text-red-400 font-bold">
          <XCircle size={16} />
          {error}
          <button onClick={() => setError("")} className="ml-auto hover:text-red-300">X</button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 p-4 rounded-xl text-xs text-green-400 font-bold">
          <CheckCircle2 size={16} />
          {success}
          <button onClick={() => setSuccess("")} className="ml-auto hover:text-green-300">X</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Formulario de creación */}
        <div className="lg:col-span-2">
          <Card className="border-zinc-200/5 dark:border-white/[0.04]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <UserPlus size={14} className="text-brand" />
                NUEVO USUARIO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Nombre</label>
                    <Input
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      required
                      placeholder="John"
                      className="h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Apellido</label>
                    <Input
                      value={form.apellido}
                      onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                      required
                      placeholder="Doe"
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Correo</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      type="email"
                      value={form.correo}
                      onChange={(e) => setForm({ ...form, correo: e.target.value })}
                      required
                      placeholder="usuario@curex.com"
                      className="h-10 text-xs pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Contraseña</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      placeholder="••••••••"
                      className="h-10 text-xs pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Empresa</label>
                    <div className="relative">
                      <Building size={14} className="absolute left-3 top-3 text-muted-foreground" />
                      <select
                        value={form.empresa}
                        onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                      >
                        <option value="" disabled>Seleccionar...</option>
                        <option value="MORROCEL C.A">MORROCEL C.A</option>
                        <option value="CUREX C.A">CUREX C.A</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Departamento</label>
                    <div className="relative">
                      <Briefcase size={14} className="absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        value={form.departamento}
                        onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                        required
                        placeholder="Producción"
                        className="h-10 text-xs pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Rol</label>
                  <div className="relative">
                    <ShieldCheck size={14} className="absolute left-3 top-3 text-muted-foreground" />
                    <select
                      value={form.rol}
                      onChange={(e) => setForm({ ...form, rol: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    >
                      {ROLES_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-brand hover:bg-brand/90 text-white font-black text-xs uppercase tracking-widest h-11"
                >
                  {creating ? (
                    <Loader2 size={14} className="animate-spin mr-2" />
                  ) : (
                    <UserPlus size={14} className="mr-2" />
                  )}
                  CREAR USUARIO
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Listado de usuarios */}
        <div className="lg:col-span-3">
          <Card className="border-zinc-200/5 dark:border-white/[0.04]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <Users size={14} className="text-brand" />
                USUARIOS REGISTRADOS ({usuarios.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-muted-foreground" />
                </div>
              ) : usuarios.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground font-bold py-12 uppercase tracking-widest">
                  No hay usuarios registrados
                </p>
              ) : (
                <div className="space-y-2">
                  {usuarios.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-brand/20 transition-all group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/[0.05] flex items-center justify-center text-brand flex-shrink-0">
                          <span className="font-black text-xs">{u.nombre[0]}{u.apellido[0]}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-foreground uppercase tracking-tight truncate">
                            {u.nombre} {u.apellido}
                          </p>
                          <p className="text-[9px] text-muted-foreground font-medium mt-0.5 truncate">
                            {u.correo}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-brand bg-brand/10 px-2 py-0.5 rounded">
                              {roleLabel(u.rol)}
                            </span>
                            <span className="text-[8px] text-muted-foreground font-semibold">
                              {u.empresa}
                            </span>
                            {u.departamento && (
                              <span className="text-[8px] text-muted-foreground font-semibold">
                                {u.departamento}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deleting === u.id}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        title="Eliminar usuario"
                      >
                        {deleting === u.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
