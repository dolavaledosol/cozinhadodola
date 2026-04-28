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
export const pillClass = (tone: PillTone = "neutral"): string => `pill pill-${tone}`;

interface BaseProps {
  size?: PillSize;
  className?: string;
  icon?: ReactNode;
  title?: string;
}

interface BooleanProps extends BaseProps {
  /** Modo booleano: true→success, false→danger (sobrescreva via labels/tones) */
  active: boolean;
  trueLabel?: string;
  falseLabel?: string;
  trueTone?: PillTone;
  falseTone?: PillTone;
  // Outros modos não usados aqui
  value?: never;
  map?: never;
  tone?: never;
  children?: never;
}

interface MappedProps<K extends string = string> extends BaseProps {
  /** Modo mapeado: recebe valor + mapa */
  value: K;
  map: PillMap;
  /** Fallback quando valor não está no mapa */
  fallback?: PillMapEntry;
  // Outros modos não usados aqui
  active?: never;
  tone?: never;
  children?: never;
}

interface DirectProps extends BaseProps {
  /** Modo direto: tom + children */
  tone: PillTone;
  children: ReactNode;
  // Outros modos não usados aqui
  active?: never;
  value?: never;
  map?: never;
}

type StatusPillProps = BooleanProps | MappedProps | DirectProps;

const sizeClasses: Record<PillSize, string> = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
};

/**
 * StatusPill — badge unificado de status.
 *
 * Três modos de uso:
 *
 * 1) Booleano (ativo/inativo, pago/pendente, etc.)
 *    <StatusPill active={banco.ativo} />
 *    <StatusPill active={c.pago} trueLabel="Pago" falseLabel="Pendente" falseTone="warning" />
 *
 * 2) Mapeado (status com múltiplos valores)
 *    <StatusPill value={pedido.status} map={pedidoStatusMap} />
 *
 * 3) Direto
 *    <StatusPill tone="info">Enviado</StatusPill>
 */
const StatusPill = (props: StatusPillProps) => {
  const { size = "md", className, icon, title } = props;

  let label: ReactNode;
  let tone: PillTone;

  if ("active" in props && props.active !== undefined) {
    const {
      active,
      trueLabel = "Ativo",
      falseLabel = "Inativo",
      trueTone = "success",
      falseTone = "danger",
    } = props;
    label = active ? trueLabel : falseLabel;
    tone = active ? trueTone : falseTone;
  } else if ("map" in props && props.map) {
    const entry = props.map[props.value] ?? props.fallback ?? {
      label: props.value,
      tone: "neutral" as PillTone,
    };
    label = entry.label;
    tone = entry.tone;
  } else if ("tone" in props && props.tone) {
    label = (props as DirectProps).children;
    tone = props.tone;
  } else {
    label = "—";
    tone = "neutral";
  }

  return (
    <span
      className={cn("pill", `pill-${tone}`, sizeClasses[size], className)}
      title={title}
    >
      {icon}
      {label}
    </span>
  );
};

export default StatusPill;
