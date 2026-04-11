
DROP MATERIALIZED VIEW IF EXISTS public.vw_produtos_catalogo;

CREATE MATERIALIZED VIEW public.vw_produtos_catalogo AS
SELECT p.produto_id,
    p.nome,
    p.descricao,
    p.unidade_medida,
    p.peso_liquido,
    p.preco,
    p.destacar,
    CASE
        WHEN fp.nome IS NOT NULL THEN (fp.nome || ' > '::text) || f.nome
        ELSE f.nome
    END AS familia,
    fab.nome AS fabricante,
    ( SELECT pi.url_imagem
           FROM produto_imagem pi
          WHERE pi.produto_id = p.produto_id
          ORDER BY pi.ordem
         LIMIT 1) AS imagem_principal,
    COALESCE(jsonb_agg(jsonb_build_object('local', le.nome, 'disponivel', el.quantidade_disponivel, 'preco', el.preco, 'preco_promocional', el.preco_promocional)) FILTER (WHERE el.estoque_local_id IS NOT NULL), '[]'::jsonb) AS estoques
   FROM produto p
     LEFT JOIN familia f ON f.familia_id = p.familia_id
     LEFT JOIN familia fp ON fp.familia_id = f.familia_pai_id
     LEFT JOIN fabricante fab ON fab.fabricante_id = p.fabricante_id
     LEFT JOIN estoque_local el ON el.produto_id = p.produto_id
     LEFT JOIN local_estoque le ON le.local_estoque_id = el.local_estoque_id
  WHERE p.ativo = true
  GROUP BY p.produto_id, p.nome, p.descricao, p.unidade_medida, p.peso_liquido, p.preco, p.destacar, f.nome, fp.nome, fab.nome
WITH DATA;

CREATE UNIQUE INDEX ON public.vw_produtos_catalogo (produto_id);
