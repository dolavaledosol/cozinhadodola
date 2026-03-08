
-- Receita: template for producing a product
CREATE TABLE public.receita (
  receita_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.produto(produto_id),
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.receita ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage receita" ON public.receita FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_receita_updated_at BEFORE UPDATE ON public.receita
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Receita items: ingredients
CREATE TABLE public.receita_item (
  receita_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receita_id uuid NOT NULL REFERENCES public.receita(receita_id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produto(produto_id),
  quantidade numeric NOT NULL DEFAULT 1
);

ALTER TABLE public.receita_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage receita_item" ON public.receita_item FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Producao: production event
CREATE TABLE public.producao (
  producao_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.produto(produto_id),
  receita_id uuid REFERENCES public.receita(receita_id),
  local_estoque_id uuid NOT NULL REFERENCES public.local_estoque(local_estoque_id),
  quantidade_produzida numeric NOT NULL DEFAULT 1,
  observacao text,
  usuario_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.producao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage producao" ON public.producao FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Producao items: actual ingredients consumed
CREATE TABLE public.producao_item (
  producao_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producao_id uuid NOT NULL REFERENCES public.producao(producao_id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produto(produto_id),
  quantidade numeric NOT NULL DEFAULT 1
);

ALTER TABLE public.producao_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage producao_item" ON public.producao_item FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
