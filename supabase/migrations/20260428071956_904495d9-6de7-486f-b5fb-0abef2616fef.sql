CREATE OR REPLACE FUNCTION public.produtos_mais_vendidos(
  _periodo_dias integer DEFAULT 90,
  _limite integer DEFAULT 5
)
RETURNS TABLE(produto_id uuid, total_vendido numeric, qtd_pedidos bigint)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    pi.produto_id,
    SUM(pi.quantidade)::numeric AS total_vendido,
    COUNT(DISTINCT p.pedido_id) AS qtd_pedidos
  FROM public.pedido_item pi
  JOIN public.pedido p ON p.pedido_id = pi.pedido_id
  JOIN public.produto pr ON pr.produto_id = pi.produto_id
  WHERE p.status NOT IN ('carrinho', 'cancelado')
    AND p.data >= (now() - (_periodo_dias || ' days')::interval)
    AND pr.ativo = true
  GROUP BY pi.produto_id
  ORDER BY total_vendido DESC, qtd_pedidos DESC
  LIMIT _limite;
$$;

GRANT EXECUTE ON FUNCTION public.produtos_mais_vendidos(integer, integer) TO anon, authenticated;