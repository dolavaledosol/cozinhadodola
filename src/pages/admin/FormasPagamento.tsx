import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import StatusPill from "@/components/shared/StatusPill";
import AdminListView, { type AdminListColumn } from "@/components/admin/AdminListView";

interface FormaPagamento { forma_pagamento_id: string; nome: string; ativo: boolean; }
type SortKey = "forma_pagamento_id" | "nome" | "ativo";

const FormasPagamento = () => {
  const [items, setItems] = useState<FormaPagamento[]>([]);
  const [search, setSearch] = useState("");
  const [filterAtivo, setFilterAtivo] = useState<string>("true");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", ativo: true });
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("forma_pagamento").select("*").order("nome");
    if (data) setItems(data as any);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = items.filter((f) => {
      const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase());
      const matchAtivo = filterAtivo === "all" || (filterAtivo === "true" ? f.ativo : !f.ativo);
      return matchSearch && matchAtivo;
    });
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "forma_pagamento_id": cmp = a.forma_pagamento_id.localeCompare(b.forma_pagamento_id); break;
        case "nome": cmp = a.nome.localeCompare(b.nome, "pt-BR"); break;
        case "ativo": cmp = (a.ativo === b.ativo ? 0 : a.ativo ? -1 : 1); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [items, search, filterAtivo, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key as SortKey); setSortDir("asc"); }
  };

  const openNew = () => { setEditId(null); setForm({ nome: "", ativo: true }); setDialogOpen(true); };
  const openEdit = (f: FormaPagamento) => { setEditId(f.forma_pagamento_id); setForm({ nome: f.nome, ativo: f.ativo }); setDialogOpen(true); };

  const save = async () => {
    setLoading(true);
    const { error } = editId
      ? await supabase.from("forma_pagamento").update(form).eq("forma_pagamento_id", editId)
      : await supabase.from("forma_pagamento").insert(form);
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editId ? "Forma atualizada" : "Forma criada" });
      setDialogOpen(false);
      load();
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Formas de Pagamento"
        actions={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nova Forma</Button>}
      />
      <AdminFilterBar search={search} onSearchChange={setSearch}>
        <Select value={filterAtivo} onValueChange={setFilterAtivo}>
          <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Ativos</SelectItem>
            <SelectItem value="false">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </AdminFilterBar>
      <AdminListView<FormaPagamento>
        data={filtered}
        rowKey={(f) => f.forma_pagamento_id}
        emptyMessage="Nenhuma forma encontrada"
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSort}
        columns={[
          {
            key: "forma_pagamento_id",
            header: "Cód",
            sortable: true,
            mobileSlot: "code",
            render: (f) => (
              <button className="text-xs font-mono text-primary hover:underline cursor-pointer" onClick={() => openEdit(f)}>
                {f.forma_pagamento_id.substring(0, 8)}
              </button>
            ),
          },
          { key: "nome", header: "Nome", sortable: true, mobileSlot: "title", className: "font-medium", render: (f) => f.nome },
          {
            key: "ativo",
            header: "Status",
            sortable: true,
            mobileSlot: "badge",
            render: (f) => (
              <StatusPill active={f.ativo} />
            ),
          },
        ] satisfies AdminListColumn<FormaPagamento>[]}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Forma" : "Nova Forma"}</DialogTitle></DialogHeader>
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

export default FormasPagamento;
