import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PillTone =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "accent";

export type PillSize = "sm" | "md";

export interface PillMapEntry {
  label: string;
  tone: PillTone;
}

export type PillMap = Record<string, PillMapEntry>;

/** Retorna a classe utilitária correspondente ao tom (uso em templates de string). */
export const pillClass = (tone: PillTone = "neutral"): string =>
  `pill pill-${tone}`;

export interface StatusPillProps {
  size?: PillSize;
  className?: string;
  icon?: ReactNode;
  title?: string;

  /** Modo booleano: ativo/inativo, pago/pendente, etc. */
  active?: boolean;
  trueLabel?: string;
  falseLabel?: string;
  trueTone?: PillTone;
  falseTone?: PillTone;

  /** Modo mapeado: valor + mapa { valor: { label, tone } } */
  value?: string;
  map?: PillMap;
  fallback?: PillMapEntry;

  /** Modo direto: tom + children */
  tone?: PillTone;
  children?: ReactNode;
}

const sizeClasses: Record<PillSize, string> = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
};

/**
 * StatusPill — badge unificado de status.
 *
 * Três modos:
 *
 * 1) Booleano:    <StatusPill active={banco.ativo} />
 *                 <StatusPill active={c.pago} trueLabel="Pago" falseLabel="Pendente" falseTone="warning" />
 *
 * 2) Mapeado:     <StatusPill value={pedido.status} map={pedidoStatusMap} />
 *
 * 3) Direto:      <StatusPill tone="info">Enviado</StatusPill>
 */
const StatusPill = ({
  size = "md",
  className,
  icon,
  title,
  active,
  trueLabel = "Ativo",
  falseLabel = "Inativo",
  trueTone = "success",
  falseTone = "danger",
  value,
  map,
  fallback,
  tone,
  children,
}: StatusPillProps) => {
  let resolvedLabel: ReactNode;
  let resolvedTone: PillTone;

  if (typeof active === "boolean") {
    resolvedLabel = active ? trueLabel : falseLabel;
    resolvedTone = active ? trueTone : falseTone;
  } else if (map && value !== undefined) {
    const entry = map[value] ?? fallback ?? { label: value, tone: "neutral" as PillTone };
    resolvedLabel = entry.label;
    resolvedTone = entry.tone;
  } else if (tone) {
    resolvedLabel = children;
    resolvedTone = tone;
  } else {
    resolvedLabel = children ?? "—";
    resolvedTone = "neutral";
  }

  return (
    <span
      className={cn("pill", `pill-${resolvedTone}`, sizeClasses[size], className)}
      title={title}
    >
      {icon}
      {resolvedLabel}
    </span>
  );
};

export default StatusPill;
