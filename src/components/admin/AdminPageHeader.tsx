import { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  tabs?: ReactNode;
}

/**
 * Header padronizado para páginas admin.
 * - Sticky no topo (abaixo do header global de 48px)
 * - Altura e tipografia uniformes
 * - Mobile-first: ações empilham abaixo do título quando necessário
 */
const AdminPageHeader = ({ title, subtitle, actions, tabs }: AdminPageHeaderProps) => {
  return (
    <div className="sticky top-14 md:top-16 -mx-3 sm:-mx-4 md:-mx-6 -mt-3 sm:-mt-4 md:-mt-6 mb-3 sm:mb-4 z-20 bg-background/95 backdrop-blur-md border-b border-border/60 supports-[backdrop-filter]:bg-background/75">
      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 flex flex-row items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-xl md:text-2xl font-bold leading-tight truncate tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-2">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
      {tabs && (
        <div className="px-3 sm:px-4 md:px-6 pb-2 sm:pb-3 overflow-x-auto scrollbar-hide -mb-px">
          {tabs}
        </div>
      )}
    </div>
  );
};

export default AdminPageHeader;
