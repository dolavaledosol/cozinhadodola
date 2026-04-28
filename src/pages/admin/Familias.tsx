import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminListView, { type AdminListColumn } from "@/components/admin/AdminListView";

interface Familia {
  familia_id: string;
  nome: string;
  descricao: string | null;
  familia_pai_id: string | null;
  ativo: boolean;
  pai?: { nome: string } | null;
}

type SortKey = "familia_id" | "nome" | "pai" | "ativo";

const emptyForm = { nome: "", descricao: "", familia_pai_id: "", ativo: true };

const Familias = () => {
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [search, setSearch] = useState("");
  const [filterAtivo, setFilterAtivo] = useState<string>("true");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("familia").select("*, pai:familia_pai_id(nome)").order("nome");
    if (data) setFamilias(data as any);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = familias.filter((f) => {
      const matchSearch = f.nome.toLowerCase().includes(search.toLowerCase());
      const matchAtivo = filterAtivo === "all" || (filterAtivo === "true" ? f.ativo : !f.ativo);
      return matchSearch && matchAtivo;
    });
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "familia_id": cmp = a.familia_id.localeCompare(b.familia_id); break;
        case "nome": cmp = a.nome.localeCompare(b.nome, "pt-BR"); break;
        case "pai": cmp = (a.pai?.nome || "").localeCompare(b.pai?.nome || "", "pt-BR"); break;
        case "ativo": cmp = (a.ativo === b.ativo ? 0 : a.ativo ? -1 : 1); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [familias, search, filterAtivo, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key as SortKey); setSortDir("asc"); }
  };

  const openNew = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (f: Familia) => {
    setEditId(f.familia_id);
    setForm({ nome: f.nome, descricao: f.descricao || "", familia_pai_id: f.familia_pai_id || "", ativo: f.ativo });
    setDialogOpen(true);
  };

  const save = async () => {
    setLoading(true);
    const payload: any = { nome: form.nome, descricao: form.descricao || null, familia_pai_id: form.familia_pai_id || null, ativo: form.ativo };
    const { error } = editId
      ? await supabase.from("familia").update(payload).eq("familia_id", editId)
      : await supabase.from("familia").insert(payload);
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editId ? "Família atualizada" : "Família criada" });
      setDialogOpen(false);
      load();
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Famílias"
        actions={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nova Família</Button>}
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
      <AdminListView<Familia>
        data={filtered}
        rowKey={(f) => f.familia_id}
        emptyMessage="Nenhuma família encontrada"
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSort}
        columns={[
          {
            key: "familia_id",
            header: "Cód",
            sortable: true,
            mobileSlot: "code",
            render: (f) => (
              <button className="text-xs font-mono text-primary hover:underline cursor-pointer" onClick={() => openEdit(f)}>
                {f.familia_id.substring(0, 8)}
              </button>
            ),
          },
          { key: "nome", header: "Nome", sortable: true, mobileSlot: "title", className: "font-medium", render: (f) => f.nome },
          {
            key: "pai",
            header: "Família pai",
            sortable: true,
            mobileLabel: "Família pai",
            className: "hidden md:table-cell text-muted-foreground",
            render: (f) => f.pai?.nome || "—",
          },
          {
            key: "ativo",
            header: "Status",
            sortable: true,
            mobileSlot: "badge",
            render: (f) => (
              <span className={`text-xs px-2 py-0.5 rounded-full ${f.ativo ? "pill-success" : "pill-danger"}`}>
                {f.ativo ? "Ativo" : "Inativo"}
              </span>
            ),
          },
        ] satisfies AdminListColumn<Familia>[]}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Família" : "Nova Família"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} /></div>
            <div className="space-y-2">
              <Label>Família pai (subfamília de)</Label>
              <Select value={form.familia_pai_id || "none"} onValueChange={(v) => setForm({ ...form, familia_pai_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {familias.filter((f) => f.familia_id !== editId).map((f) => (
                    <SelectItem key={f.familia_id} value={f.familia_id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

export default Familias;
