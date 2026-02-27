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

interface Fornecedor {
  fornecedor_id: string;
  nome: string;
  ativo: boolean;
}

const Fornecedores = () => {
  const [items, setItems] = useState<Fornecedor[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", ativo: true });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("fornecedor").select("*").order("nome");
    if (data) setItems(data as any);
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((f) => f.nome.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => { setEditId(null); setForm({ nome: "", ativo: true }); setDialogOpen(true); };
  const openEdit = (f: Fornecedor) => { setEditId(f.fornecedor_id); setForm({ nome: f.nome, ativo: f.ativo }); setDialogOpen(true); };

  const save = async () => {
    setLoading(true);
    const { error } = editId
      ? await supabase.from("fornecedor").update(form).eq("fornecedor_id", editId)
      : await supabase.from("fornecedor").insert(form);
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editId ? "Fornecedor atualizado" : "Fornecedor criado" });
      setDialogOpen(false);
      load();
    }
  };

  const softDelete = async (id: string) => {
    await supabase.from("fornecedor").update({ ativo: false }).eq("fornecedor_id", id);
    toast({ title: "Fornecedor desativado" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Fornecedores</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Fornecedor</Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum fornecedor encontrado</TableCell></TableRow>
            ) : filtered.map((f) => (
              <TableRow key={f.fornecedor_id}>
                <TableCell className="font-medium">{f.nome}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.ativo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {f.ativo ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => softDelete(f.fornecedor_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /><Label>Ativo</Label></div>
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

export default Fornecedores;
