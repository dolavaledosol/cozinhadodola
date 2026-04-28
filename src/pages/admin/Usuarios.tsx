import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserCog, Plus, Trash2, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PermissionsDialog from "@/components/admin/PermissionsDialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminListView, { type AdminListColumn } from "@/components/admin/AdminListView";
import StatusPill, { type PillMap } from "@/components/shared/StatusPill";

interface UserProfile {
  profile_id: string;
  nome: string;
  avatar_url: string | null;
  email?: string;
  roles: string[];
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "vendedor", label: "Vendedor" },
  { value: "cliente", label: "Cliente" },
];

const roleMap: PillMap = {
  admin: { label: "Admin", tone: "danger" },
  vendedor: { label: "Vendedor", tone: "info" },
  cliente: { label: "Cliente", tone: "success" },
};

type SortKey = "profile_id" | "nome" | "email" | "roles";

const Usuarios = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editNome, setEditNome] = useState("");
  const [saving, setSaving] = useState(false);

  const [roleOpen, setRoleOpen] = useState(false);
  const [roleUser, setRoleUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState("");

  const [permOpen, setPermOpen] = useState(false);
  const [permUser, setPermUser] = useState<UserProfile | null>(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("profile_id, nome, avatar_url").order("nome");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const { data: clientes } = await supabase.from("cliente").select("user_id, email");

    if (profiles) {
      const roleMap: Record<string, string[]> = {};
      (roles || []).forEach((r: any) => { if (!roleMap[r.user_id]) roleMap[r.user_id] = []; roleMap[r.user_id].push(r.role); });
      const emailMap: Record<string, string> = {};
      (clientes || []).forEach((c: any) => { if (c.user_id && c.email) emailMap[c.user_id] = c.email; });
      setUsers(profiles.map((p: any) => ({ profile_id: p.profile_id, nome: p.nome, avatar_url: p.avatar_url, email: emailMap[p.profile_id] || "", roles: roleMap[p.profile_id] || [] })));
    }
    setLoading(false);
  };

  const handleSort = useCallback((key: string) => {
    setSortKey((prev) => { if (prev === key) { setSortDir((d) => (d === "asc" ? "desc" : "asc")); } else { setSortDir("asc"); } return key as SortKey; });
  }, []);

  const filtered = useMemo(() => {
    let result = users.filter((u) => u.nome.toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase()));
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "profile_id": cmp = a.profile_id.localeCompare(b.profile_id); break;
        case "nome": cmp = a.nome.localeCompare(b.nome, "pt-BR"); break;
        case "email": cmp = (a.email || "").localeCompare(b.email || "", "pt-BR"); break;
        case "roles": cmp = a.roles.join(",").localeCompare(b.roles.join(",")); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [users, search, sortKey, sortDir]);

  const openEdit = (u: UserProfile) => { setEditUser(u); setEditNome(u.nome); setEditOpen(true); };

  const saveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ nome: editNome }).eq("profile_id", editUser.profile_id);
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Perfil atualizado" }); setEditOpen(false); loadUsers(); }
  };

  const openRoles = (u: UserProfile) => { setRoleUser(u); setNewRole(""); setRoleOpen(true); };

  const addRole = async () => {
    if (!roleUser || !newRole) return;
    if (roleUser.roles.includes(newRole)) { toast({ title: "Usuário já possui esta role", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: roleUser.profile_id, role: newRole as any });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
    else { toast({ title: `Role "${newRole}" adicionada` }); loadUsers(); setRoleUser({ ...roleUser, roles: [...roleUser.roles, newRole] }); }
  };

  const removeRole = async (role: string) => {
    if (!roleUser) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", roleUser.profile_id).eq("role", role as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
    else { toast({ title: `Role "${role}" removida` }); setRoleUser({ ...roleUser, roles: roleUser.roles.filter((r) => r !== role) }); loadUsers(); }
  };

  const roleBadge = (r: string) => (
    <StatusPill key={r} value={r} map={roleMap} />
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Usuários" />
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou email..."
      />

      {loading ? (
        <div className="space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
      ) : (
        <>
          <AdminListView<UserProfile>
            data={filtered}
            rowKey={(u) => u.profile_id}
            emptyMessage="Nenhum usuário encontrado"
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={handleSort}
            columns={[
              {
                key: "profile_id",
                header: "Cód",
                sortable: true,
                mobileSlot: "code",
                render: (u) => (
                  <button className="text-xs font-mono text-primary hover:underline" onClick={() => openEdit(u)}>
                    {u.profile_id.substring(0, 8)}
                  </button>
                ),
              },
              { key: "nome", header: "Nome", sortable: true, mobileSlot: "title", className: "font-medium", render: (u) => u.nome || "Sem nome" },
              { key: "email", header: "Email", sortable: true, mobileLabel: "Email", className: "text-sm text-muted-foreground", render: (u) => u.email || "—" },
              {
                key: "roles",
                header: "Roles",
                sortable: true,
                mobileLabel: "Roles",
                render: (u) => (
                  <div className="flex flex-wrap gap-1 items-center">
                    {u.roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                    {u.roles.map((r) => roleBadge(r))}
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={(e) => { e.stopPropagation(); openRoles(u); }} title="Gerenciar roles"><Shield className="h-3 w-3" /></Button>
                  </div>
                ),
              },
              {
                key: "perm",
                header: "Perm.",
                mobileSlot: "badge",
                className: "w-20",
                render: (u) => (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setPermUser(u); setPermOpen(true); }} title="Permissões"><Lock className="h-4 w-4" /></Button>
                ),
              },
            ] satisfies AdminListColumn<UserProfile>[]}
          />
          <p className="text-sm text-muted-foreground">{filtered.length} usuário(s)</p>
        </>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={editNome} onChange={(e) => setEditNome(e.target.value)} /></div>
            {editUser?.email && (<div className="space-y-2"><Label>Email</Label><Input value={editUser.email} disabled className="bg-muted" /></div>)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Roles Dialog */}
      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" /> Gerenciar Roles</DialogTitle></DialogHeader>
          {roleUser && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Usuário: <strong>{roleUser.nome || roleUser.email}</strong></p>
              <div className="space-y-2">
                <Label>Roles atuais</Label>
                {roleUser.roles.length === 0 ? (<p className="text-sm text-muted-foreground">Nenhuma role atribuída</p>) : (
                  <div className="space-y-2">
                    {roleUser.roles.map((r) => (
                      <div key={r} className="flex items-center justify-between border rounded-md px-3 py-2">
                        <StatusPill value={r} map={roleMap} />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeRole(r)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Adicionar role</Label>
                <div className="flex gap-2">
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Selecionar role..." /></SelectTrigger>
                    <SelectContent>{ROLE_OPTIONS.filter((o) => !roleUser.roles.includes(o.value)).map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                  </Select>
                  <Button onClick={addRole} disabled={!newRole || saving} className="gap-1"><Plus className="h-4 w-4" /> Adicionar</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {permUser && <PermissionsDialog open={permOpen} onOpenChange={setPermOpen} userId={permUser.profile_id} userName={permUser.nome || permUser.email || ""} />}
    </div>
  );
};

export default Usuarios;
