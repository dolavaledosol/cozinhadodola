
-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Admin manage contas_pagar" ON public.contas_pagar;

CREATE POLICY "Admin manage contas_pagar"
ON public.contas_pagar
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
