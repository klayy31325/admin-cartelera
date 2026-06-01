"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Database,
  Search,
  RefreshCw,
  User,
  Clock,
  Activity,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Info,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api-config";

interface SystemLog {
  id: number;
  usuario_id: number;
  accion: string;
  descripcion: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  nombre: string;
  apellido: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("curex_token");
      const res = await fetch(`${API_BASE_URL}/logs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      } else if (data.success && Array.isArray(data.data)) {
        setLogs(data.data);
      }
    } catch (error) {
      toast.error("Error al cargar el registro de actividad");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const searchStr = searchTerm.toLowerCase();
    return (
      log.accion.toLowerCase().includes(searchStr) ||
      log.descripcion.toLowerCase().includes(searchStr) ||
      `${log.nombre} ${log.apellido}`.toLowerCase().includes(searchStr)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, logs]);

  const getLogTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'success': return <CheckCircle2 className="text-green-500" size={16} />;
      case 'warning': return <AlertCircle className="text-amber-500" size={16} />;
      case 'error': return <Trash2 className="text-red-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  const getLogTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'success': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'warning': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Deseas eliminar este registro de la auditoría?")) return;
    try {
      const token = localStorage.getItem("curex_token");
      // Asumiendo que existe un endpoint de borrado de logs, si no lo ignoramos
      const res = await fetch(`${API_BASE_URL}/logs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Registro eliminado");
        fetchLogs();
      }
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">
            REGISTRO DE <span className="text-brand">ACTIVIDAD</span>
          </h1>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
            Auditoría en tiempo real de operaciones y cambios en el sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            className="border-border hover:bg-muted font-bold text-[10px] uppercase tracking-widest"
          >
            <RefreshCw className={`mr-2 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-card border-border shadow-soft overflow-hidden">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <Input
              placeholder="Filtrar por acción, usuario o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background border-border pl-10 h-11 rounded-xl font-bold text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table Container */}
      <Card className="bg-card border-border shadow-soft overflow-hidden border-t-2 border-t-brand/50 flex flex-col">
        <CardHeader className="border-b border-border bg-muted/30 p-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand/10 rounded-lg text-brand">
              <Shield size={18} />
            </div>
            <CardTitle className="text-lg font-black uppercase tracking-tight">Bitácora del Sistema</CardTitle>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest ml-auto">
              {filteredLogs.length} eventos registrados
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="relative overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            <Table>
              <TableHeader className="bg-muted/95 backdrop-blur-md sticky top-0 z-10 shadow-sm border-b border-border">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 w-[180px]">Fecha y Hora</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 w-[150px]">Usuario</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 w-[120px]">Acción</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Descripción Detallada</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-right">Auditor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-8 w-8 text-brand animate-spin" />
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cargando bitácora...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                      No hay actividad registrada que coincida con la búsqueda
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((log) => (
                      <TableRow key={log.id} className="border-border hover:bg-muted/30 transition-colors group">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-zinc-500" />
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-foreground">
                                {new Date(log.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                              </span>
                              <span className="text-[10px] font-bold text-zinc-500">
                                {new Date(log.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                              <User size={14} className="text-zinc-500" />
                            </div>
                            <span className="font-bold text-xs text-zinc-300">
                              {log.nombre} {log.apellido}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                            getLogTypeColor(log.tipo)
                          )}>
                            {getLogTypeIcon(log.tipo)}
                            {log.accion}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-xl break-words group-hover:text-zinc-200 transition-colors">
                            {log.descripcion}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(log.id)}
                            className="h-8 w-8 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredLogs.length > itemsPerPage && (
            <div className="p-4 border-t border-border bg-muted/10 flex flex-col items-center gap-3">
              <div className="flex items-center gap-8">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="h-10 w-10 rounded-full text-zinc-500 hover:text-brand hover:bg-brand/10 disabled:opacity-20 transition-all"
                >
                  <ChevronLeft size={20} strokeWidth={3} />
                </Button>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">
                    Página {currentPage} / {Math.ceil(filteredLogs.length / itemsPerPage)}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPage >= Math.ceil(filteredLogs.length / itemsPerPage)}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="h-10 w-10 rounded-full text-zinc-500 hover:text-brand hover:bg-brand/10 disabled:opacity-20 transition-all"
                >
                  <ChevronRight size={20} strokeWidth={3} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
