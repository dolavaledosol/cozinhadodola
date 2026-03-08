import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

interface ReceitaItem {
  receita_item_id?: string;
  produto_id: string;
  quantidade: number;
}

interface ReceitaForm {
  receita_id?: string;
  produto_id: string;
  nome: string;
  ativo: boolean;
  itens: ReceitaItem[];
}

const emptyForm: ReceitaForm = { produto_id: "", nome: "", ativo: true, itens: [] };

const Receitas = () => {
  const qc = useQueryClient();
  const { can } = usePermissions();
  const canEdit = can("receitas" as any, "editar");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ReceitaForm>(emptyForm);

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos-ativos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produto")
        .select("produto_id, nome, unidade_medida")
        .eq("ativo", true)
        .order("nome");
      return data || [];
    },
  });

  const { data: receitas = [], isLoading } = useQuery({
    queryKey: ["receitas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("receita")
        .select("*, receita_item(*)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const produtoMap = Object.fromEntries(produtos.map((p) => [p.produto_id, p]));

  const saveMutation = useMutation({
    mutationFn: async (f: ReceitaForm) => {
      if (f.receita_id) {
        await supabase.from("receita").update({
          produto_id: f.produto_id, nome: f.nome, ativo: f.ativo,
        }).eq("receita_id", f.receita_id).throwOnError();

        await supabase.from("receita_item").delete().eq("receita_id", f.receita_id).throwOnError();

        if (f.itens.length > 0) {
          await supabase.from("receita_item").insert(
            f.itens.map((i) => ({ receita_id: f.receita_id!, produto_id: i.produto_id, quantidade: i.quantidade }))
          ).throwOnError();
        }
      } else {
        const { data } = await supabase.from("receita").insert({
          produto_id: f.produto_id, nome: f.nome, ativo: f.ativo,
        }).select("receita_id").single().throwOnError();

        if (f.itens.length > 0) {
          await supabase.from("receita_item").insert(
            f.itens.map((i) => ({ receita_id: data!.receita_id, produto_id: i.produto_id, quantidade: i.quantidade }))
          ).throwOnError();
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receitas"] });
      setDialogOpen(false);
      toast.success("Receita salva!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("receita").delete().eq("receita_id", id).throwOnError();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receitas"] });
      toast.success("Receita excluída!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (r: any) => {
    setForm({
      receita_id: r.receita_id,
      produto_id: r.produto_id,
      nome: r.nome,
      ativo: r.ativo,
      itens: (r.receita_item || []).map((i: any) => ({
        receita_item_id: i.receita_item_id,
        produto_id: i.produto_id,
        quantidade: Number(i.quantidade),
      })),
    });
    setDialogOpen(true);
  };

  const openNew = () => { setForm(emptyForm); setDialogOpen(true); };

  const addItem = () => setForm((f) => ({ ...f, itens: [...f.itens, { produto_id: "", quantidade: 1 }] }));

  const removeItem = (idx: number) =>
    setForm((f) => ({ ...f, itens: f.itens.filter((_, i) => i !== idx) }));

  const updateItem = (idx: number, field: string, value: any) =>
    setForm((f) => ({
      ...f,
      itens: f.itens.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    }));

  const valid = form.produto_id && form.nome.trim() && form.itens.length > 0 && form.itens.every((i) => i.produto_id && i.quantidade > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Receitas de Produção</h1>
          <p className="text-muted-foreground text-sm">Defina os ingredientes para fabricar produtos</p>
        </div>
        {canEdit && (
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Receita</Button>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto Final</TableHead>
              <TableHead>Nome da Receita</TableHead>
              <TableHead>Ingredientes</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="w-24">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : receitas.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma receita cadastrada</TableCell></TableRow>
            ) : (
              receitas.map((r: any) => (
                <TableRow key={r.receita_id}>
                  <TableCell className="font-medium">{produtoMap[r.produto_id]?.nome || r.produto_id}</TableCell>
                  <TableCell>{r.nome}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(r.receita_item || []).map((i: any) => (
                        <Badge key={i.receita_item_id} variant="secondary" className="text-xs">
                          {i.quantidade}x {produtoMap[i.produto_id]?.nome || "?"}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.ativo ? "default" : "outline"}>
                      {r.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive"
                          onClick={() => { if (confirm("Excluir receita?")) deleteMutation.mutate(r.receita_id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.receita_id ? "Editar Receita" : "Nova Receita"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produto Final *</Label>
                <Select value={form.produto_id} onValueChange={(v) => setForm((f) => ({ ...f, produto_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                  <SelectContent>
                    {produtos.map((p) => (
                      <SelectItem key={p.produto_id} value={p.produto_id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome da Receita *</Label>
                <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Receita padrão" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ingredientes *</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" />Adicionar
                </Button>
              </div>

              {form.itens.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                  Adicione ingredientes à receita
                </p>
              )}

              {form.itens.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Select value={item.produto_id} onValueChange={(v) => updateItem(idx, "produto_id", v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Produto" /></SelectTrigger>
                    <SelectContent>
                      {produtos
                        .filter((p) => p.produto_id !== form.produto_id)
                        .map((p) => (
                          <SelectItem key={p.produto_id} value={p.produto_id}>{p.nome}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" min={0.1} step={0.1} className="w-24"
                    value={item.quantidade} onChange={(e) => updateItem(idx, "quantidade", Number(e.target.value))} />
                  <span className="text-xs text-muted-foreground w-8">
                    {produtoMap[item.produto_id]?.unidade_medida || ""}
                  </span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button disabled={!valid || saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Receitas;
