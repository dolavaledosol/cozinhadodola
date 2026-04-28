import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Alias de description (compatibilidade com AdminPageHeader) */
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
  className?: string;
  /** Cabeçalho fixo no topo (logo abaixo do topbar global) */
  sticky?: boolean;
  /** Reduz a margem inferior */
  compact?: boolean;
}

/**
 * Header padrão de página. Usado por cliente e admin (via AdminPageHeader).
 * Mobile-first: ações sempre na mesma linha do título, com truncate.
 */
const PageHeader = ({
  title,
  description,
  subtitle,
  icon,
  actions,
  tabs,
  className,
  sticky = false,
  compact = false,
}: PageHeaderProps) => {
  const desc = description ?? subtitle;

  const wrapperBase = sticky
    ? "sticky top-14 md:top-16 z-20 -mx-4 md:-mx-6 -mt-4 md:-mt-6 bg-background/95 backdrop-blur-md border-b border-border/60 supports-[backdrop-filter]:bg-background/75"
    : "";

  const innerPadding = sticky ? "px-4 md:px-6 py-2.5 md:py-4" : "";

  // Quando sticky, o espaçamento abaixo do header é dado pelo padding interno
  // do wrapper sticky (para evitar gap visível entre o header fixo e o conteúdo
  // que rola por baixo). Quando não-sticky, usamos margin-bottom normal.
  const marginBottom = sticky
    ? "mb-4 md:mb-6"
    : compact
      ? "mb-3 md:mb-4"
      : "mb-4 md:mb-6";

  return (
    <div className={cn(wrapperBase, marginBottom, className)}>
      <div
        className={cn(
          innerPadding,
          "flex flex-row items-center justify-between gap-2 sm:gap-3"
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon && (
            <div className="shrink-0 h-9 w-9 md:h-10 md:w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold leading-tight truncate tracking-tight text-foreground">
              {title}
            </h1>
            {desc && (
              <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-2">
                {desc}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
      {tabs && (
        <div
          className={cn(
            sticky ? "px-4 md:px-6 pb-2 md:pb-3" : "pb-2",
            "overflow-x-auto scrollbar-hide -mb-px"
          )}
        >
          {tabs}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
