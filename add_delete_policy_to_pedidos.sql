-- Policy to allow users to delete orders from their own school
-- First drop if it exists to be safe
DROP POLICY IF EXISTS "Users can delete orders in their school" ON public.pedidos_materiais;

CREATE POLICY "Users can delete orders in their school" ON public.pedidos_materiais
    FOR DELETE
    USING (
        fk_colegio = (SELECT fk_colegio FROM public.users WHERE uuid = auth.uid())
    );
