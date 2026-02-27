import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

interface Fabricante {
  fabricante_id: string;
  nome: string;
  ativo: boolean;
}

const Fabricantes = () => {
  const [fabricantes, setFabricantes] = useState<Fabricante[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", ativo: true });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("fabricante").select("*").order("nome");
    if (data) setFabricantes(data as any);
  };

  useEffect(() => { load(); }, []);

  const filtered = fabricantes.filter((f) => f.nome.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setEditId(null); setForm({ nome: "", ativo: true }); setDialogOpen(true); };
  const openEdit = (f: Fabricante) => { setEditId(f.fabricante_id); setForm({ nome: f.nome, ativo: f.ativo }); setDialogOpen(true); };

  const save = async () => {
    setLoading(true);
    const { error } = editId
      ? await supabase.from("fabricante").update(form).eq("fabricante_id", editId)
      : await supabase.from("fabricante").insert(form);
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editId ? "Fabricante atualizado" : "Fabricante criado" });
      setDialogOpen(false);
      load();
    }
  };

  const softDelete = async (id: string) => {
    await supabase.from("fabricante").update({ ativo: false }).eq("fabricante_id", id);
    toast({ title: "Fabricante desativado" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Fabricantes</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Fabricante</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum fabricante encontrado</TableCell></TableRow>
            ) : filtered.map((f) => (
              <TableRow key={f.fabricante_id}>
                <TableCell className="font-medium">{f.nome}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.ativo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {f.ativo ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => softDelete(f.fabricante_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Fabricante" : "Novo Fabricante"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={loading || !form.nome}>{loading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fabricantes;
