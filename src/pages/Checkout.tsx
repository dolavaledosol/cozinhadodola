import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, ArrowLeft, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <ShoppingBag className="h-16 w-16 text-muted-foreground stroke-1" />
        <p className="text-lg text-muted-foreground">Seu carrinho está vazio</p>
        <Link to="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
          </Button>
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <LogIn className="h-16 w-16 text-muted-foreground stroke-1" />
        <p className="text-lg text-muted-foreground">Faça login para finalizar o pedido</p>
        <Link to="/auth?redirect=/checkout">
          <Button className="gap-2">
            <LogIn className="h-4 w-4" /> Entrar / Cadastrar
          </Button>
        </Link>
        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
          </Button>
        </Link>
      </div>
    );
  }

  const handleFinalize = async () => {
    setLoading(true);
    try {
      // Find or create cliente for this user
      let { data: cliente } = await supabase
        .from("cliente")
        .select("cliente_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cliente) {
        const { data: newCliente, error: cErr } = await supabase
          .from("cliente")
          .insert({ nome: user.email ?? "Cliente", email: user.email, user_id: user.id })
          .select("cliente_id")
          .single();
        if (cErr) throw cErr;
        cliente = newCliente;
      }

      // Create pedido
      const { data: pedido, error: pErr } = await supabase
        .from("pedido")
        .insert({
          cliente_id: cliente!.cliente_id,
          total,
          status: "separacao",
          origem: "web",
        })
        .select("pedido_id")
        .single();
      if (pErr) throw pErr;

      // Create pedido_items
      const pedidoItems = items.map((item) => ({
        pedido_id: pedido!.pedido_id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
      }));

      const { error: iErr } = await supabase.from("pedido_item").insert(pedidoItems);
      if (iErr) throw iErr;

      // Create status history
      await supabase.from("pedido_status_historico").insert({
        pedido_id: pedido!.pedido_id,
        status: "separacao",
        usuario_id: user.id,
      });

      clearCart();
      toast({ title: "Pedido criado com sucesso!", description: "Acompanhe o status no seu perfil." });
      navigate("/perfil");
    } catch (err: any) {
      toast({ title: "Erro ao criar pedido", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
        </Link>

        <h1 className="text-2xl font-bold mb-6">Finalizar Pedido</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Itens do pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div key={item.produto_id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">{item.quantidade}x R$ {item.preco.toFixed(2)}</p>
                </div>
                <span className="font-semibold text-sm">
                  R$ {(item.preco * item.quantidade).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" size="lg" onClick={handleFinalize} disabled={loading}>
          {loading ? "Processando..." : "Confirmar Pedido"}
        </Button>
      </div>
    </div>
  );
};

export default Checkout;
