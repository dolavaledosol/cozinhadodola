import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Width = "narrow" | "default" | "wide" | "full";

interface PageContainerProps {
  children: ReactNode;
  /**
   * narrow  → max-w-lg   (forms, checkout, perfil)
   * default → max-w-3xl  (telas admin de detalhe/edição)
   * wide    → max-w-7xl  (catálogo, listagens densas)
   * full    → sem limite
   */
  width?: Width;
  className?: string;
  /** Remove padding vertical (útil quando a página gerencia o próprio espaçamento) */
  noPaddingY?: boolean;
}

const widthMap: Record<Width, string> = {
  narrow: "max-w-lg",
  default: "max-w-3xl",
  wide: "max-w-7xl",
  full: "max-w-none",
};

/**
 * Container padrão de página.
 * Padding mobile-first consistente (px-4 py-4 → md:px-6 md:py-6).
 */
const PageContainer = ({
  children,
  width = "default",
  className,
  noPaddingY = false,
}: PageContainerProps) => {
  return (
    <div
      className={cn(
        "w-full mx-auto px-4 md:px-6",
        noPaddingY ? "" : "py-4 md:py-6",
        widthMap[width],
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageContainer;
