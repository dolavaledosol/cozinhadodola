
CREATE OR REPLACE FUNCTION public.ajustar_estoque(
  _produto_id uuid,
  _local_estoque_id uuid,
  _delta numeric,
  _preco_custo numeric DEFAULT NULL,
  _preco_venda numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Try to update existing record atomically
  UPDATE public.estoque_local
  SET quantidade_disponivel = quantidade_disponivel + _delta,
      preco_custo = COALESCE(_preco_custo, preco_custo),
      preco = COALESCE(_preco_venda, preco)
  WHERE produto_id = _produto_id AND local_estoque_id = _local_estoque_id;

  -- If no row was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO public.estoque_local (produto_id, local_estoque_id, quantidade_disponivel, preco_custo, preco)
    VALUES (_produto_id, _local_estoque_id, GREATEST(0, _delta), COALESCE(_preco_custo, 0), COALESCE(_preco_venda, 0));
  END IF;
END;
$$;
