import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Para uso dentro de páginas com PageContainer (sem padding extra) */
  compact?: boolean;
}

/**
 * Cabeçalho padrão de página (interno, não confundir com AppHeader/topbar).
 * Mobile-first: ações ficam abaixo do título no mobile e à direita no desktop.
 */
const PageHeader = ({
  title,
  description,
  icon,
  actions,
  className,
  compact = false,
}: PageHeaderProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        compact ? "mb-4" : "mb-5 md:mb-6",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="shrink-0 h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground truncate">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
