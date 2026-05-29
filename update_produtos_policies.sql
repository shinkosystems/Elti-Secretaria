-- Update policies for produtos table to allow ALL users in the same school to manage products

-- Remove old policies if they exist (to ensure we apply the new ones correctly)
DROP POLICY IF EXISTS "Managers can insert products for their school" ON public.produtos;
DROP POLICY IF EXISTS "Managers can update products in their school" ON public.produtos;
DROP POLICY IF EXISTS "Managers can delete products in their school" ON public.produtos;
DROP POLICY IF EXISTS "Users can view products from their school" ON public.produtos;

-- 1. Everyone in the same school can view products
CREATE POLICY "Users can view products from their school" ON public.produtos
    FOR SELECT
    USING (
        fk_colegio IN (
            SELECT fk_colegio FROM public.users WHERE uuid = auth.uid()
        )
    );

-- 2. ALL users can insert products for their school
CREATE POLICY "Users can insert products for their school" ON public.produtos
    FOR INSERT
    WITH CHECK (
        fk_colegio IN (
            SELECT fk_colegio FROM public.users WHERE uuid = auth.uid()
        )
    );

-- 3. ALL users can update products in their school
CREATE POLICY "Users can update products in their school" ON public.produtos
    FOR UPDATE
    USING (
        fk_colegio IN (
            SELECT fk_colegio FROM public.users WHERE uuid = auth.uid()
        )
    )
    WITH CHECK (
        fk_colegio IN (
            SELECT fk_colegio FROM public.users WHERE uuid = auth.uid()
        )
    );

-- 4. ALL users can delete products in their school
CREATE POLICY "Users can delete products in their school" ON public.produtos
    FOR DELETE
    USING (
        fk_colegio IN (
            SELECT fk_colegio FROM public.users WHERE uuid = auth.uid()
        )
    );
