import { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Header padronizado para páginas admin.
 * - Sticky no topo (abaixo do header global de 48px)
 * - Altura e tipografia uniformes
 * - Mobile-first: ações empilham abaixo do título quando necessário
 */
const AdminPageHeader = ({ title, subtitle, actions }: AdminPageHeaderProps) => {
  return (
    <div className="sticky top-12 -mx-3 sm:-mx-4 md:-mx-6 -mt-3 sm:-mt-4 md:-mt-6 mb-4 z-20 bg-background/95 backdrop-blur-sm border-b">
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPageHeader;
