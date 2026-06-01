"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CatalogsPage() {
  const [data, setData] = useState<{ clients: any[]; products: any[]; reasons: any[] }>({
    clients: [],
    products: [],
    reasons: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchCatalogs = async () => {
    try {
      const res = await fetch("/api/catalogs");
      const d = await res.json();
      setData(d);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const handleAddItem = async (type: string) => {
    if (!newItemName) return;
    setAdding(true);
    try {
      const res = await fetch("/api/catalogs", {
        method: "POST",
        body: JSON.stringify({ type, name: newItemName }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      toast.success("Agregado correctamente");
      setNewItemName("");
      fetchCatalogs();
    } catch (error) {
      toast.error("Error al agregar");
    } finally {
      setAdding(false);
    }
  };

  const filteredData = (list: any[]) => {
    return list.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-zinc-200/5 dark:border-white/[0.04] bg-zinc-100/50 dark:bg-zinc-900/30 p-5 rounded-lg relative overflow-hidden mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-brand">
            <Database size={12} />
            MANTENIMIENTO // TABLAS
          </div>
          <h1 className="text-base font-black tracking-widest text-foreground uppercase mt-1">
            GESTIÓN DE CATÁLOGOS
          </h1>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-relaxed">
            Administración centralizada de clientes, productos y razones de parada del sistema.
          </p>
        </div>
      </header>

      <Tabs defaultValue="clients" className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="reasons">Razones de Parada</TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-800"
            />
          </div>
        </div>

        {["clients", "products", "reasons"].map((type) => (
          <TabsContent key={type} value={type}>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="capitalize">{type === 'reasons' ? 'Razones de Parada' : type}</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder={`Nuevo ${type === 'reasons' ? 'razón' : type.slice(0, -1)}...`}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-48 bg-slate-950 border-slate-800"
                  />
                  <Button
                    onClick={() => handleAddItem(type.slice(0, -1))}
                    disabled={adding || !newItemName}
                    className="bg-brand hover:bg-brand-dark text-white"
                  >
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-800">
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-brand" />
                        </TableCell>
                      </TableRow>
                    ) : filteredData((data as any)[type]).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-slate-500 italic">
                          No se encontraron resultados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData((data as any)[type]).map((item: any) => (
                        <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="font-mono text-xs text-slate-500">#{item.id}</TableCell>
                          <TableCell className="font-medium text-slate-200">{item.name}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}
