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

interface LocalEstoque { local_estoque_id: string; nome: string; ativo: boolean; }
type SortKey = "local_estoque_id" | "nome" | "ativo";

const LocaisEstoque = () => {
  const [items, setItems] = useState<LocalEstoque[]>([]);
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
    const { data } = await supabase.from("local_estoque").select("*").order("nome");
    if (data) setItems(data as any);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = items.filter((i) => {
      const matchSearch = i.nome.toLowerCase().includes(search.toLowerCase());
      const matchAtivo = filterAtivo === "all" || (filterAtivo === "true" ? i.ativo : !i.ativo);
      return matchSearch && matchAtivo;
    });
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "local_estoque_id": cmp = a.local_estoque_id.localeCompare(b.local_estoque_id); break;
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
  const openEdit = (i: LocalEstoque) => { setEditId(i.local_estoque_id); setForm({ nome: i.nome, ativo: i.ativo }); setDialogOpen(true); };

  const save = async () => {
    setLoading(true);
    const { error } = editId
      ? await supabase.from("local_estoque").update(form).eq("local_estoque_id", editId)
      : await supabase.from("local_estoque").insert(form);
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editId ? "Local atualizado" : "Local criado" });
      setDialogOpen(false);
      load();
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Locais de Estoque"
        actions={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Local</Button>}
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
      <AdminListView<LocalEstoque>
        data={filtered}
        rowKey={(i) => i.local_estoque_id}
        emptyMessage="Nenhum local encontrado"
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSort}
        columns={[
          {
            key: "local_estoque_id",
            header: "Cód",
            sortable: true,
            mobileSlot: "code",
            render: (i) => (
              <button className="text-xs font-mono text-primary hover:underline cursor-pointer" onClick={() => openEdit(i)}>
                {i.local_estoque_id.substring(0, 8)}
              </button>
            ),
          },
          { key: "nome", header: "Nome", sortable: true, mobileSlot: "title", className: "font-medium", render: (i) => i.nome },
          {
            key: "ativo",
            header: "Status",
            sortable: true,
            mobileSlot: "badge",
            render: (i) => (
              <StatusPill active={i.ativo} />
            ),
          },
        ] satisfies AdminListColumn<LocalEstoque>[]}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Local" : "Novo Local"}</DialogTitle></DialogHeader>
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

export default LocaisEstoque;
