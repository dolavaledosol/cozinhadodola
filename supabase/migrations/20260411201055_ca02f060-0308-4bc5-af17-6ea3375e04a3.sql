
DROP MATERIALIZED VIEW IF EXISTS public.vw_produtos_catalogo;

CREATE MATERIALIZED VIEW public.vw_produtos_catalogo AS
SELECT
  p.produto_id,
  p.nome,
  p.descricao,
  p.unidade_medida,
  p.peso_liquido,
  p.preco,
  p.destacar,
  p.familia_id,
  f.nome   AS familia,
  fab.nome AS fabricante,
  (SELECT pi2.url_imagem
     FROM public.produto_imagem pi2
    WHERE pi2.produto_id = p.produto_id
    ORDER BY pi2.ordem
    LIMIT 1) AS imagem_principal,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'estoque_local_id', el.estoque_local_id,
        'local_estoque_id', el.local_estoque_id,
        'nome',             le.nome,
        'preco',            el.preco,
        'preco_promocional',el.preco_promocional,
        'quantidade_disponivel', el.quantidade_disponivel
      )
    ) FILTER (WHERE el.estoque_local_id IS NOT NULL),
    '[]'::jsonb
  ) AS estoques
FROM public.produto p
LEFT JOIN public.familia f   ON f.familia_id = p.familia_id
LEFT JOIN public.fabricante fab ON fab.fabricante_id = p.fabricante_id
LEFT JOIN public.estoque_local el ON el.produto_id = p.produto_id
LEFT JOIN public.local_estoque le ON le.local_estoque_id = el.local_estoque_id
WHERE p.ativo = true
GROUP BY p.produto_id, p.nome, p.descricao, p.unidade_medida, p.peso_liquido,
         p.preco, p.destacar, p.familia_id, f.nome, fab.nome
WITH DATA;

CREATE UNIQUE INDEX ON public.vw_produtos_catalogo (produto_id);
