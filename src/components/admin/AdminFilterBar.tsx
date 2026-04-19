import { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AdminFilterBarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onSearchKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Selects, toggles ou outros controles à direita da busca */
  children?: ReactNode;
  /** Botões/ações empilhadas após os filtros (ex.: Exportar, Importar) */
  actions?: ReactNode;
  className?: string;
}

/**
 * Barra de filtros padronizada para páginas admin.
 * - Layout consistente: busca expansível à esquerda + selects/ações à direita
 * - Mobile-first: empilha em coluna no mobile, linha no sm+
 * - Mesma altura, espaçamento e estilo em todas as páginas
 * - Deve ser colocada logo abaixo do <AdminPageHeader />
 */
const AdminFilterBar = ({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  onSearchKeyDown,
  children,
  actions,
  className,
}: AdminFilterBarProps) => {
  const hasSearch = onSearchChange !== undefined;

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center", className)}>
      {hasSearch && (
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={search ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={onSearchKeyDown}
            className="pl-10"
          />
        </div>
      )}
      {children && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:shrink-0">
          {children}
        </div>
      )}
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default AdminFilterBar;
