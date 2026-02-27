import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save } from "lucide-react";

interface Configuracao {
  configuracao_id: string;
  chave: string;
  valor: string | null;
}

const emptyForm = { chave: "", valor: "" };

const Configuracoes = () => {
  const [items, setItems] = useState<Configuracao[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase
      .from("configuracao")
      .select("configuracao_id, chave, valor")
      .is("user_id", null)
      .order("chave");
    if (data) setItems(data);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Configuracao) => {
    setEditId(c.configuracao_id);
    setForm({ chave: c.chave, valor: c.valor || "" });
    setDialogOpen(true);
  };

  const save = async () => {
    setLoading(true);
    const payload = { chave: form.chave, valor: form.valor || null, user_id: null };
    const { error } = editId
      ? await supabase.from("configuracao").update(payload).eq("configuracao_id", editId)
      : await supabase.from("configuracao").insert(payload);
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editId ? "Configuração atualizada" : "Configuração criada" });
      setDialogOpen(false);
      load();
    }
  };

  const remove = async (id: string) => {
    await supabase.from("configuracao").delete().eq("configuracao_id", id);
    toast({ title: "Configuração removida" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nova Configuração</Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chave</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhuma configuração encontrada</TableCell></TableRow>
            ) : items.map((c) => (
              <TableRow key={c.configuracao_id}>
                <TableCell className="font-medium font-mono text-sm">{c.chave}</TableCell>
                <TableCell className="text-muted-foreground">{c.valor || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(c.configuracao_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Configuração" : "Nova Configuração"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Chave *</Label><Input value={form.chave} onChange={(e) => setForm({ ...form, chave: e.target.value })} placeholder="ex: nome_loja" /></div>
            <div className="space-y-2"><Label>Valor</Label><Input value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={loading || !form.chave}>{loading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuracoes;
