/**
 * Formata o nome do produto no padrão compacto:
 *   "Pão Francês 500g (kg) · Padaria X"
 *
 * Campos vazios são omitidos. Aceita formatos flexíveis para
 * peso/unidade/fabricante vindos das diversas queries do projeto.
 */
export interface ProdutoLabelInput {
  nome?: string | null;
  peso_liquido?: number | string | null;
  peso_bruto?: number | string | null;
  unidade_medida?: string | null;
  // fabricante pode vir como string direta ou como { nome }
  fabricante?: string | { nome?: string | null } | null;
}

export function formatProdutoLabel(p: ProdutoLabelInput | null | undefined): string {
  if (!p) return "";
  const nome = (p.nome || "").trim();
  const peso = p.peso_liquido ?? p.peso_bruto ?? null;
  const unidade = (p.unidade_medida || "").trim();
  const fabricante = typeof p.fabricante === "string"
    ? p.fabricante
    : p.fabricante?.nome || "";

  let pesoStr = "";
  if (peso !== null && peso !== undefined && peso !== "") {
    const n = typeof peso === "number" ? peso : Number(peso);
    if (!Number.isNaN(n) && n > 0) {
      pesoStr = `${n}${unidade || ""}`;
    }
  }

  // Se não há peso mas há unidade, mostrar entre parênteses
  let head = nome;
  if (pesoStr) {
    head = `${nome} ${pesoStr}`;
    if (unidade) head = `${nome} ${pesoStr} (${unidade})`;
  } else if (unidade) {
    head = `${nome} (${unidade})`;
  }

  if (fabricante) return `${head} · ${fabricante}`;
  return head;
}
