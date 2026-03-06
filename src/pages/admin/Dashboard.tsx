import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, TrendingDown, TrendingUp, CalendarDays, BarChart3, ClipboardList } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const StatCard = ({ title, value, icon: Icon, description }: {
  title: string; value: string; icon: any; description?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
);

type OrigemFat = { origem: string; total: number; qtd: number };
type StatusResumo = { status: string; qtd: number; total: number };

const STATUS_LABELS: Record<string, string> = {
  separacao: "Separação",
  aguardando_pagamento: "Aguardando Pgto",
  pago: "Pago",
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    pedidosHoje: 0,
    faturamento: 0,
    pedidosMes: 0,
    faturamentoMes: 0,
    totalPagar: 0,
    qtdPagar: 0,
    totalReceber: 0,
    qtdReceber: 0,
  });
  const [origemFat, setOrigemFat] = useState<OrigemFat[]>([]);
  const [statusResumo, setStatusResumo] = useState<StatusResumo[]>([]);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthStartISO = monthStart.toISOString();

      const [pedidosHoje, pedidosMes, pagar, receber] = await Promise.all([
        supabase.from("pedido").select("total, status").gte("data", today),
        supabase.from("pedido").select("total, status, origem").gte("data", monthStartISO),
        supabase.from("contas_pagar").select("valor").eq("pago", false),
        supabase.from("contas_receber").select("valor").eq("recebido", false),
      ]);

      const pedidosHojeData = (pedidosHoje.data || []).filter((p: any) => p.status !== "carrinho");
      const pedidosMesData = (pedidosMes.data || []).filter((p: any) => p.status !== "carrinho");

      const faturamentoHoje = pedidosHojeData
        .filter((p: any) => p.status !== "cancelado")
        .reduce((s: number, p: any) => s + Number(p.total), 0);

      const faturamentoMes = pedidosMesData
        .filter((p: any) => p.status !== "cancelado")
        .reduce((s: number, p: any) => s + Number(p.total), 0);

      // Faturamento por origem
      const origemMap: Record<string, { total: number; qtd: number }> = {};
      pedidosMesData
        .filter((p: any) => p.status !== "cancelado")
        .forEach((p: any) => {
          const o = p.origem || "web";
          if (!origemMap[o]) origemMap[o] = { total: 0, qtd: 0 };
          origemMap[o].total += Number(p.total);
          origemMap[o].qtd += 1;
        });
      setOrigemFat(
        Object.entries(origemMap).map(([origem, v]) => ({ origem, ...v }))
          .sort((a, b) => b.total - a.total)
      );

      // Status resumo (separacao, aguardando_pagamento, pago)
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
        pedidosHoje: pedidosHojeData.length,
        faturamento: faturamentoHoje,
        pedidosMes: pedidosMesData.filter((p: any) => p.status !== "cancelado").length,
        faturamentoMes,
        totalPagar: pagarData.reduce((s: number, r: any) => s + Number(r.valor), 0),
        qtdPagar: pagarData.length,
        totalReceber: receberData.reduce((s: number, r: any) => s + Number(r.valor), 0),
        qtdReceber: receberData.length,
      });
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pedidos hoje" value={String(stats.pedidosHoje)} icon={ShoppingCart} />
        <StatCard
          title="Faturamento hoje"
          value={`R$ ${stats.faturamento.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard title="Pedidos do mês" value={String(stats.pedidosMes)} icon={CalendarDays} />
        <StatCard
          title="Faturamento mês"
          value={`R$ ${stats.faturamentoMes.toFixed(2)}`}
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Contas a Pagar pendentes</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ {stats.totalPagar.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.qtdPagar} conta(s) em aberto</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Contas a Receber pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {stats.totalReceber.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.qtdReceber} conta(s) em aberto</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Faturamento por origem (mês)</CardTitle>
          </CardHeader>
          <CardContent>
            {origemFat.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido no mês.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {origemFat.map((o) => (
                    <TableRow key={o.origem}>
                      <TableCell className="capitalize">{o.origem}</TableCell>
                      <TableCell className="text-right">{o.qtd}</TableCell>
                      <TableCell className="text-right">R$ {o.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Pedidos em andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusResumo.every(s => s.qtd === 0) ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido em andamento.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statusResumo.map((s) => (
                    <TableRow key={s.status}>
                      <TableCell>{STATUS_LABELS[s.status] || s.status}</TableCell>
                      <TableCell className="text-right">{s.qtd}</TableCell>
                      <TableCell className="text-right">R$ {s.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
