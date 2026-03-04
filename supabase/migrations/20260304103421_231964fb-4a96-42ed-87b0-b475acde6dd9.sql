
-- Add status_compra to contas_pagar (pendente, recebido, pago, cancelado)
ALTER TABLE public.contas_pagar 
  ADD COLUMN IF NOT EXISTS status_compra text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS local_estoque_id uuid REFERENCES public.local_estoque(local_estoque_id),
  ADD COLUMN IF NOT EXISTS compra_itens jsonb;

-- Update existing records: pago=true -> status 'pago', pago=false -> 'pendente'
UPDATE public.contas_pagar SET status_compra = CASE WHEN pago THEN 'pago' ELSE 'pendente' END;
