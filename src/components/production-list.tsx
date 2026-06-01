"use client";

import { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  ClipboardList, Search, Calendar, Cpu, TrendingUp, AlertCircle, RefreshCw 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api-config";

interface ProductionRecord {
  id: number;
  metros_producidos: number;
  fecha: string;
  status_orden: string;
  maquina_nombre: string;
  producto: string;
  cliente: string;
  created_at: string;
}

export function ProductionList() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("curex_token");
      const res = await fetch(`${API_BASE_URL}/produccion`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (error) {
      toast.error("Error al cargar registros de producción");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = records.filter(r => {
    const searchStr = searchTerm.toLowerCase();
    return (
      r.producto.toLowerCase().includes(searchStr) ||
      r.cliente.toLowerCase().includes(searchStr) ||
      r.maquina_nombre.toLowerCase().includes(searchStr) ||
      r.status_orden.toLowerCase().includes(searchStr)
    );
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <Input
            placeholder="Buscar por producto, cliente o máquina..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-900/50 border-zinc-800 pl-10 h-11 rounded-xl text-sm"
          />
        </div>
        <Button 
          onClick={fetchRecords} 
          variant="outline" 
          className="h-11 rounded-xl border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-[10px]"
        >
          <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Table */}
      <div className="bg-muted/10 border border-zinc-800 rounded-2xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-900/80 backdrop-blur-md">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Fecha</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Máquina</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Producto / Cliente</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Metros</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <RefreshCw className="animate-spin text-brand mx-auto mb-2" size={24} />
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cargando bitácora...</p>
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-zinc-600 font-bold uppercase text-[10px] tracking-widest">
                    No se encontraron registros de producción
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((r) => (
                  <TableRow key={r.id} className="border-zinc-800 hover:bg-zinc-800/20 transition-all group">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-zinc-500" />
                        <span className="text-xs font-black text-zinc-300">
                          {new Date(r.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-brand">
                        <Cpu size={14} />
                        <span className="text-xs font-black uppercase tracking-tighter">{r.maquina_nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-zinc-200 uppercase tracking-tight truncate max-w-[300px]">
                          {r.producto}
                        </p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                          {r.cliente}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-green-500/50" />
                        <span className="text-sm font-black text-white tabular-nums">
                          {Number(r.metros_producidos).toLocaleString()} m
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border",
                        r.status_orden === 'PRODUCCION' || r.status_orden === 'PROCESO'
                          ? "bg-brand/10 text-brand border-brand/20"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      )}>
                        {r.status_orden}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
