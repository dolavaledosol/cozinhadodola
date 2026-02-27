
-- Allow authenticated users to insert their own pedidos
CREATE POLICY "Users can insert own pedidos"
  ON public.pedido FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cliente
      WHERE cliente.cliente_id = pedido.cliente_id
      AND cliente.user_id = auth.uid()
    )
  );

-- Allow authenticated users to insert pedido_items for their own pedidos
CREATE POLICY "Users can insert own pedido_item"
  ON public.pedido_item FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pedido
      JOIN cliente ON cliente.cliente_id = pedido.cliente_id
      WHERE pedido.pedido_id = pedido_item.pedido_id
      AND cliente.user_id = auth.uid()
    )
  );

-- Allow authenticated users to insert pedido_status_historico for their own pedidos
CREATE POLICY "Users can insert own pedido_historico"
  ON public.pedido_status_historico FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pedido
      JOIN cliente ON cliente.cliente_id = pedido.cliente_id
      WHERE pedido.pedido_id = pedido_status_historico.pedido_id
      AND cliente.user_id = auth.uid()
    )
  );

-- Allow authenticated users to insert endereco
CREATE POLICY "Authenticated insert endereco"
  ON public.endereco FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to insert cliente_endereco for their own cliente
CREATE POLICY "Users insert own cliente_endereco"
  ON public.cliente_endereco FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cliente
      WHERE cliente.cliente_id = cliente_endereco.cliente_id
      AND cliente.user_id = auth.uid()
    )
  );

-- Allow authenticated users to insert their own cliente (for auto-creation)
CREATE POLICY "Users can insert own cliente"
  ON public.cliente FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
