import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

interface EstoqueLocal {
  estoque_local_id: string;
  produto_id: string;
  local_estoque_id: string;
  preco: number;
  preco_promocional: number | null;
  quantidade_disponivel: number;
  quantidade_pedida_nao_separada: number;
  produto: { nome: string } | null;
  local_estoque: { nome: string } | null;
}

interface SelectOption { id: string; nome: string; }

const emptyForm = {
  produto_id: "", local_estoque_id: "", preco: "", preco_promocional: "",
  quantidade_disponivel: "", quantidade_pedida_nao_separada: "0",
};

const Estoque = () => {
  const [items, setItems] = useState<EstoqueLocal[]>([]);
  const [produtos, setProdutos] = useState<SelectOption[]>([]);
  const [locais, setLocais] = useState<SelectOption[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const [{ data: est }, { data: prod }, { data: loc }] = await Promise.all([
      supabase.from("estoque_local").select("*, produto(nome), local_estoque(nome)").order("produto_id"),
      supabase.from("produto").select("produto_id, nome").eq("ativo", true).order("nome"),
      supabase.from("local_estoque").select("local_estoque_id, nome").eq("ativo", true).order("nome"),
    ]);
    if (est) setItems(est as any);
    if (prod) setProdutos(prod.map((p) => ({ id: p.produto_id, nome: p.nome })));
    if (loc) setLocais(loc.map((l) => ({ id: l.local_estoque_id, nome: l.nome })));
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((i) => {
    const term = search.toLowerCase();
    return !term || i.produto?.nome?.toLowerCase().includes(term) || i.local_estoque?.nome?.toLowerCase().includes(term);
  });

  const openNew = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (e: EstoqueLocal) => {
    setEditId(e.estoque_local_id);
    setForm({
      produto_id: e.produto_id, local_estoque_id: e.local_estoque_id,
      preco: String(e.preco), preco_promocional: e.preco_promocional != null ? String(e.preco_promocional) : "",
      quantidade_disponivel: String(e.quantidade_disponivel),
      quantidade_pedida_nao_separada: String(e.quantidade_pedida_nao_separada),
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setLoading(true);
    const payload = {
      produto_id: form.produto_id,
      local_estoque_id: form.local_estoque_id,
      preco: Number(form.preco),
      preco_promocional: form.preco_promocional ? Number(form.preco_promocional) : null,
      quantidade_disponivel: Number(form.quantidade_disponivel),
      quantidade_pedida_nao_separada: Number(form.quantidade_pedida_nao_separada),
    };
    const { error } = editId
      ? await supabase.from("estoque_local").update(payload).eq("estoque_local_id", editId)
      : await supabase.from("estoque_local").insert(payload);
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editId ? "Estoque atualizado" : "Estoque criado" });
      setDialogOpen(false);
      load();
    }
  };

  const remove = async (id: string) => {
    await supabase.from("estoque_local").delete().eq("estoque_local_id", id);
    toast({ title: "Registro removido" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Estoque</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Registro</Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar produto ou local..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="hidden sm:table-cell">Local</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="hidden md:table-cell">Promo</TableHead>
              <TableHead>Disp.</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</TableCell></TableRow>
            ) : filtered.map((e) => (
              <TableRow key={e.estoque_local_id}>
                <TableCell className="font-medium">{e.produto?.nome || "—"}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{e.local_estoque?.nome || "—"}</TableCell>
                <TableCell>R$ {Number(e.preco).toFixed(2)}</TableCell>
                <TableCell className="hidden md:table-cell">{e.preco_promocional != null ? `R$ ${Number(e.preco_promocional).toFixed(2)}` : "—"}</TableCell>
                <TableCell>{e.quantidade_disponivel}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(e.estoque_local_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Estoque" : "Novo Estoque"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Produto *</Label>
              <Select value={form.produto_id} onValueChange={(v) => setForm({ ...form, produto_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{produtos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Local de Estoque *</Label>
              <Select value={form.local_estoque_id} onValueChange={(v) => setForm({ ...form, local_estoque_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{locais.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Preço *</Label><Input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} /></div>
              <div className="space-y-2"><Label>Preço Promocional</Label><Input type="number" step="0.01" value={form.preco_promocional} onChange={(e) => setForm({ ...form, preco_promocional: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Qtd Disponível *</Label><Input type="number" value={form.quantidade_disponivel} onChange={(e) => setForm({ ...form, quantidade_disponivel: e.target.value })} /></div>
              <div className="space-y-2"><Label>Qtd Pedida Não Sep.</Label><Input type="number" value={form.quantidade_pedida_nao_separada} onChange={(e) => setForm({ ...form, quantidade_pedida_nao_separada: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={loading || !form.produto_id || !form.local_estoque_id || !form.preco}>{loading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Estoque;
