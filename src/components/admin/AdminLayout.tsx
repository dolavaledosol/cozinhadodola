import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, ROUTE_TO_RESOURCE } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Settings, ShieldAlert, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/shared/PageContainer";

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { can, loading: permLoading } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }

    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!data) { navigate("/", { replace: true }); return; }
      setIsAdmin(true);
    };
    checkAdmin();
  }, [user, authLoading, navigate]);

  if (authLoading || isAdmin === null || permLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  const resource = ROUTE_TO_RESOURCE[location.pathname];
  const hasAccess = resource ? can(resource, "ver") : true;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 bg-sidebar text-sidebar-foreground">
            <div className="flex h-14 md:h-16 items-center justify-between gap-2 px-3 md:px-4">
              <div className="flex items-center gap-2 min-w-0">
                <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" />
                <Link to="/admin" className="flex items-center shrink-0">
                  <img
                    src="/images/logo-cozinha-dodola-branco.png"
                    alt="CozinhaDoDola"
                    className="h-10 md:h-12 w-auto"
                  />
                </Link>
                <span className="text-sm font-semibold text-sidebar-foreground/70 hidden md:inline">
                  Painel Admin
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
                  onClick={() => navigate("/")}
                >
                  <Store className="h-4 w-4" />
                  <span className="hidden sm:inline">Catálogo</span>
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <PageContainer width="full">
              {hasAccess ? (
                children
              ) : (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
                  <ShieldAlert className="h-12 w-12" />
                  <p className="text-lg font-medium">Acesso negado</p>
                  <p className="text-sm text-center">
                    Você não tem permissão para acessar este recurso.
                  </p>
                </div>
              )}
            </PageContainer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
