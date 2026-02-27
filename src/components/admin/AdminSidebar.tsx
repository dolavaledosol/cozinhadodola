import {
  LayoutDashboard, Package, Layers, Factory, Users, ShoppingCart,
  DollarSign, Settings, LogOut, Truck, Warehouse, Boxes, Landmark, CreditCard,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Produtos", url: "/admin/produtos", icon: Package },
  { title: "Famílias", url: "/admin/familias", icon: Layers },
  { title: "Fabricantes", url: "/admin/fabricantes", icon: Factory },
  { title: "Fornecedores", url: "/admin/fornecedores", icon: Truck },
  { title: "Clientes", url: "/admin/clientes", icon: Users },
  { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingCart },
  { title: "Locais Estoque", url: "/admin/locais-estoque", icon: Warehouse },
  { title: "Estoque", url: "/admin/estoque", icon: Boxes },
  { title: "Bancos", url: "/admin/bancos", icon: Landmark },
  { title: "Formas Pgto", url: "/admin/formas-pagamento", icon: CreditCard },
  { title: "Financeiro", url: "/admin/financeiro", icon: DollarSign },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
];

const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const isActive = (url: string) =>
    url === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs uppercase tracking-wider">
              CozinhaDoDola
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className="w-full justify-start gap-2"
          onClick={async () => { await signOut(); navigate("/"); }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
