import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { format, subDays, startOfDay, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#f97316", "#14b8a6", "#8b5cf6", "#ec4899", "#64748b",
];

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Periodo = "7" | "30" | "90";

const ProducaoRelatorio = () => {
  const [periodo, setPeriodo] = useState<Periodo>("30");

  const dataInicio = useMemo(() => startOfDay(subDays(new Date(), Number(periodo))), [periodo]);

  const { data: producoes = [] } = useQuery({
    queryKey: ["producao-relatorio", periodo],
    queryFn: async () => {
      const { data } = await supabase
        .from("producao")
        .select("producao_id, produto_id, quantidade_produzida, custo_total, cancelado, created_at, producao_item(produto_id, quantidade)")
        .gte("created_at", dataInicio.toISOString())
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos-ativos"],
    queryFn: async () => {
      const { data } = await supabase.from("produto").select("produto_id, nome").eq("ativo", true);
      return data || [];
    },
  });

  const produtoMap = useMemo(
    () => Object.fromEntries(produtos.map((p) => [p.produto_id, p.nome])),
    [produtos]
  );

  const ativas = useMemo(() => producoes.filter((p: any) => !p.cancelado), [producoes]);

  // 1. Quantidade produzida por dia
  const producaoPorDia = useMemo(() => {
    const map: Record<string, { dia: string; quantidade: number; custo: number }> = {};
    for (const p of ativas as any[]) {
      const dia = format(parseISO(p.created_at), "dd/MM");
      if (!map[dia]) map[dia] = { dia, quantidade: 0, custo: 0 };
      map[dia].quantidade += Number(p.quantidade_produzida);
      map[dia].custo += Number(p.custo_total || 0);
    }
    return Object.values(map);
  }, [ativas]);

  // 2. Custo acumulado ao longo do tempo
  const custoAcumulado = useMemo(() => {
    let acc = 0;
    return producaoPorDia.map((d) => {
      acc += d.custo;
      return { dia: d.dia, custo_acumulado: acc };
    });
  }, [producaoPorDia]);

  // 3. Top produtos fabricados
  const topProdutos = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of ativas as any[]) {
      const nome = produtoMap[p.produto_id] || "Desconhecido";
      map[nome] = (map[nome] || 0) + Number(p.quantidade_produzida);
    }
    return Object.entries(map)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [ativas, produtoMap]);

  // 4. Top ingredientes consumidos
  const topIngredientes = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of ativas as any[]) {
      for (const item of (p.producao_item || [])) {
        const nome = produtoMap[item.produto_id] || "Desconhecido";
        map[nome] = (map[nome] || 0) + Number(item.quantidade);
      }
    }
    return Object.entries(map)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [ativas, produtoMap]);

  // KPIs
  const totalProduzido = ativas.reduce((s: number, p: any) => s + Number(p.quantidade_produzida), 0);
  const totalCusto = ativas.reduce((s: number, p: any) => s + Number(p.custo_total || 0), 0);
  const totalProducoes = ativas.length;
  const canceladas = producoes.filter((p: any) => p.cancelado).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Relatório de Produção</h2>
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Produções</p>
          <p className="text-2xl font-bold">{totalProducoes}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Unidades Produzidas</p>
          <p className="text-2xl font-bold">{totalProduzido}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Custo Total</p>
          <p className="text-2xl font-bold">{formatBRL(totalCusto)}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Canceladas</p>
          <p className="text-2xl font-bold">{canceladas}</p>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produção por dia */}
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Quantidade Produzida por Dia</h3>
          {producaoPorDia.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={producaoPorDia}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="quantidade" name="Quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Custo acumulado */}
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Custo Acumulado</h3>
          {custoAcumulado.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={custoAcumulado}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground"
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}${v >= 1000 ? 'k' : ''}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [formatBRL(v), "Custo Acumulado"]}
                />
                <Line type="monotone" dataKey="custo_acumulado" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top produtos fabricados */}
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Top Produtos Fabricados</h3>
          {topProdutos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={topProdutos} dataKey="quantidade" nameKey="nome" cx="50%" cy="50%"
                  outerRadius={100} label={({ nome, percent }) => `${nome.slice(0, 15)}${nome.length > 15 ? '…' : ''} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {topProdutos.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [v, name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Top ingredientes consumidos */}
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Top Ingredientes Consumidos</h3>
          {topIngredientes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topIngredientes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={120}
                  tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="quantidade" name="Consumido" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProducaoRelatorio;
