import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart, TrendingDown, TrendingUp,
  CalendarDays, BarChart3, ClipboardList,
  ChevronRight, CalendarMinus, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import PullToRefresh from "@/components/shared/PullToRefresh";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtCompact = (v: number) => {
  if (Math.abs(v) >= 1000) {
    return "R$ " + (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "k";
  }
  return fmt(v);
};

type OrigemFat = {
  origem: string;
  totalHoje: number;
  qtdHoje: number;
  totalMes: number;
  qtdMes: number;
  totalMesAnt: number;
  qtdMesAnt: number;
};
type LocalFat = {
  local_estoque_id: string | null;
  nome: string;
  totalHoje: number;
  totalMes: number;
  totalMesAnt: number;
};
type StatusResumo = { status: string; qtd: number; total: number };

const STATUS_LABELS: Record<string, string> = {
  separacao: "Separação",
  aguardando_pagamento: "Aguard. Pgto",
  pago: "Pago",
};

const STATUS_COLORS: Record<string, string> = {
  separacao: "bg-warning/15 text-warning border-warning/30",
  aguardando_pagamento: "bg-primary/10 text-primary border-primary/30",
  pago: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
};

const ORIGEM_LABELS: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  admin: "Admin",
};

const Dashboard = () => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pedidosHoje: 0, faturamento: 0,
    pedidosMes: 0, faturamentoMes: 0,
    pedidosMesAnt: 0, faturamentoMesAnt: 0,
    totalPagar: 0, qtdPagar: 0,
    totalReceber: 0, qtdReceber: 0,
  });
  const [origemFat, setOrigemFat] = useState<OrigemFat[]>([]);
  const [localFat, setLocalFat] = useState<LocalFat[]>([]);
  const [statusResumo, setStatusResumo] = useState<StatusResumo[]>([]);

  const loadData = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartISO = monthStart.toISOString();

    const prevMonthEnd = new Date(monthStart);
    prevMonthEnd.setMilliseconds(-1);
    const prevMonthStart = new Date(prevMonthEnd);
    prevMonthStart.setDate(1);
    prevMonthStart.setHours(0, 0, 0, 0);
    const prevMonthStartISO = prevMonthStart.toISOString();
    const prevMonthEndISO = prevMonthEnd.toISOString();

    const [pedidosHoje, pedidosMes, pedidosMesAnt, pagar, receber, locais] = await Promise.all([
      supabase.from("pedido").select("total, status, origem, local_estoque_id").gte("data", today),
      supabase.from("pedido").select("total, status, origem, local_estoque_id").gte("data", monthStartISO),
      supabase.from("pedido").select("total, status, origem, local_estoque_id").gte("data", prevMonthStartISO).lte("data", prevMonthEndISO),
      supabase.from("contas_pagar").select("valor").eq("pago", false),
      supabase.from("contas_receber").select("valor").eq("recebido", false),
      supabase.from("local_estoque").select("local_estoque_id, nome"),
    ]);

    const localNomes: Record<string, string> = {};
    (locais.data || []).forEach((l: any) => { localNomes[l.local_estoque_id] = l.nome; });

    const filterValid = (data: any[]) => (data || []).filter((p: any) => p.status !== "carrinho");
    const filterActive = (data: any[]) => data.filter((p: any) => p.status !== "cancelado");

    const pedidosHojeData = filterValid(pedidosHoje.data);
    const pedidosMesData = filterValid(pedidosMes.data);
    const pedidosMesAntData = filterValid(pedidosMesAnt.data);

    const sumTotal = (data: any[]) => filterActive(data).reduce((s: number, p: any) => s + Number(p.total), 0);
    const countActive = (data: any[]) => filterActive(data).length;

    // Origem breakdown
    const origemMap: Record<string, OrigemFat> = {};
    const addOrigem = (data: any[], key: "Hoje" | "Mes" | "MesAnt") => {
      filterActive(data).forEach((p: any) => {
        const o = p.origem || "web";
        if (!origemMap[o]) origemMap[o] = { origem: o, totalHoje: 0, qtdHoje: 0, totalMes: 0, qtdMes: 0, totalMesAnt: 0, qtdMesAnt: 0 };
        if (key === "Hoje") { origemMap[o].totalHoje += Number(p.total); origemMap[o].qtdHoje += 1; }
        if (key === "Mes") { origemMap[o].totalMes += Number(p.total); origemMap[o].qtdMes += 1; }
        if (key === "MesAnt") { origemMap[o].totalMesAnt += Number(p.total); origemMap[o].qtdMesAnt += 1; }
      });
    };
    addOrigem(pedidosHojeData, "Hoje");
    addOrigem(pedidosMesData, "Mes");
    addOrigem(pedidosMesAntData, "MesAnt");
    setOrigemFat(Object.values(origemMap).sort((a, b) => b.totalMes - a.totalMes));

    // Status resumo
    const targetStatuses = ["separacao", "aguardando_pagamento", "pago"];
    const sMap: Record<string, { qtd: number; total: number }> = {};
    targetStatuses.forEach(s => { sMap[s] = { qtd: 0, total: 0 }; });
    pedidosMesData.forEach((p: any) => {
      if (targetStatuses.includes(p.status)) {
        sMap[p.status].qtd += 1;
        sMap[p.status].total += Number(p.total);
      }
    });
    setStatusResumo(targetStatuses.map(s => ({ status: s, ...sMap[s] })));

    const pagarData = pagar.data || [];
    const receberData = receber.data || [];

    setStats({
      pedidosHoje: countActive(pedidosHojeData),
      faturamento: sumTotal(pedidosHojeData),
      pedidosMes: countActive(pedidosMesData),
      faturamentoMes: sumTotal(pedidosMesData),
      pedidosMesAnt: countActive(pedidosMesAntData),
      faturamentoMesAnt: sumTotal(pedidosMesAntData),
      totalPagar: pagarData.reduce((s: number, r: any) => s + Number(r.valor), 0),
      qtdPagar: pagarData.length,
      totalReceber: receberData.reduce((s: number, r: any) => s + Number(r.valor), 0),
      qtdReceber: receberData.length,
    });

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const totalAndamento = statusResumo.reduce((a, s) => a + s.qtd, 0);

  // Delta mês atual vs anterior
  const delta = useMemo(() => {
    const ant = stats.faturamentoMesAnt;
    const atual = stats.faturamentoMes;
    if (ant === 0) return { pct: atual > 0 ? 100 : 0, dir: atual > 0 ? "up" : "flat" as const };
    const pct = ((atual - ant) / ant) * 100;
    return { pct, dir: pct > 1 ? "up" : pct < -1 ? "down" : "flat" } as { pct: number; dir: "up" | "down" | "flat" };
  }, [stats.faturamentoMes, stats.faturamentoMesAnt]);

  // Dados consolidados do gráfico comparativo
  const chartData = useMemo(() => {
    return origemFat.map((o) => ({
      name: ORIGEM_LABELS[o.origem] || o.origem,
      Hoje: o.totalHoje,
      "Mês": o.totalMes,
      "Mês ant.": o.totalMesAnt,
    }));
  }, [origemFat]);

  if (loading) {
    return (
      <div className="space-y-4 pb-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const DeltaIcon = delta.dir === "up" ? ArrowUpRight : delta.dir === "down" ? ArrowDownRight : Minus;
  const deltaColor =
    delta.dir === "up" ? "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/20"
    : delta.dir === "down" ? "text-destructive bg-destructive/10 border-destructive/20"
    : "text-muted-foreground bg-muted border-border";

  const content = (
    <div className="space-y-4 pb-6">
      <AdminPageHeader title="Dashboard" subtitle="Resumo geral" />

      {/* HERO – Faturamento do mês em destaque */}
      <Link
        to="/admin/pedidos"
        className="block relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:p-6 group hover:border-primary/40 transition-all active:scale-[0.99]"
      >
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Faturamento do mês</span>
            </div>
            <p className="mt-2 text-3xl sm:text-4xl font-bold text-foreground leading-none tracking-tight tabular-nums">
              {fmt(stats.faturamentoMes)}
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${deltaColor}`}>
                <DeltaIcon className="h-3 w-3" />
                {Math.abs(delta.pct).toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                vs. {fmtCompact(stats.faturamentoMesAnt)} mês ant.
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {stats.pedidosMes} pedidos
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
        </div>
      </Link>

      {/* KPIs secundários compactos – 2 col mobile, 4 col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/admin/pedidos" className="rounded-xl bg-card border border-border p-3 hover:border-primary/40 transition-colors group active:scale-[0.98]">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Hoje</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-foreground leading-none tabular-nums">{stats.pedidosHoje}</p>
          <p className="mt-1 text-[11px] text-muted-foreground truncate tabular-nums">{fmtCompact(stats.faturamento)}</p>
        </Link>

        <Link to="/admin/pedidos" className="rounded-xl bg-card border border-border p-3 hover:border-primary/40 transition-colors group active:scale-[0.98]">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarMinus className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Mês ant.</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-foreground leading-none tabular-nums">{stats.pedidosMesAnt}</p>
          <p className="mt-1 text-[11px] text-muted-foreground truncate tabular-nums">{fmtCompact(stats.faturamentoMesAnt)}</p>
        </Link>

        <Link to="/admin/financeiro" className="rounded-xl bg-[hsl(var(--success))]/5 border border-[hsl(var(--success))]/20 p-3 hover:border-[hsl(var(--success))]/40 transition-colors group active:scale-[0.98]">
          <div className="flex items-center gap-1.5 text-[hsl(var(--success))]">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">A receber</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-[hsl(var(--success))] leading-none truncate tabular-nums">{fmtCompact(stats.totalReceber)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">{stats.qtdReceber} pendente(s)</p>
        </Link>

        <Link to="/admin/financeiro" className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 hover:border-destructive/40 transition-colors group active:scale-[0.98]">
          <div className="flex items-center gap-1.5 text-destructive">
            <TrendingDown className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">A pagar</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-destructive leading-none truncate tabular-nums">{fmtCompact(stats.totalPagar)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">{stats.qtdPagar} pendente(s)</p>
        </Link>
      </div>

      {/* Pedidos em andamento */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <Link to="/admin/pedidos" className="flex items-center justify-between px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors group">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Pedidos em andamento</h2>
          </div>
          <div className="flex items-center gap-2">
            {totalAndamento > 0 && (
              <Badge variant="secondary" className="text-[11px] font-bold px-2 py-0.5">
                {totalAndamento}
              </Badge>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
        {statusResumo.every(s => s.qtd === 0) ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum pedido em andamento
          </div>
        ) : (
          <div className="divide-y divide-border">
            {statusResumo.map((s) => (
              <div key={s.status} className="flex items-center justify-between px-4 py-3 gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${STATUS_COLORS[s.status] || ""}`}>
                  {STATUS_LABELS[s.status] || s.status}
                </span>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-sm font-medium text-foreground tabular-nums">{s.qtd}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground tabular-nums min-w-0 truncate">{fmt(s.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Faturamento por origem – gráfico único comparativo */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Faturamento por origem</h2>
          </div>
          <span className="text-[11px] text-muted-foreground">Hoje · Mês · Mês ant.</span>
        </div>
        {chartData.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum pedido registrado
          </div>
        ) : (
          <div className="p-3 sm:p-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => fmtCompact(v).replace("R$ ", "")} width={50} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => fmt(value)}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} iconType="circle" />
                <Bar dataKey="Hoje" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Mês" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Mês ant." fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
      {content}
    </PullToRefresh>
  );
};

export default Dashboard;
