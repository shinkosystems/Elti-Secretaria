-- Create the produtos table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nome TEXT NOT NULL,
    preco INTEGER NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    fk_colegio INTEGER NOT NULL -- Assuming fk_colegio is an integer based on users table
);

-- Enable Row Level Security
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Policies for produtos table

-- 1. Everyone in the same school can view products
CREATE POLICY "Users can view products from their school" ON public.produtos
    FOR SELECT
    USING (
        fk_colegio IN (
            SELECT fk_colegio FROM public.users WHERE uuid = auth.uid()
        )
    );

-- 2. Managers can insert products for their school
CREATE POLICY "Managers can insert products for their school" ON public.produtos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = auth.uid()
            AND tipousuario = 'Manager'
            AND fk_colegio = public.produtos.fk_colegio
        )
    );

-- 3. Managers can update products in their school
CREATE POLICY "Managers can update products in their school" ON public.produtos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = auth.uid()
            AND tipousuario = 'Manager'
            AND fk_colegio = public.produtos.fk_colegio
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = auth.uid()
            AND tipousuario = 'Manager'
            AND fk_colegio = public.produtos.fk_colegio
        )
    );

-- 4. Managers can delete products in their school
CREATE POLICY "Managers can delete products in their school" ON public.produtos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE uuid = auth.uid()
            AND tipousuario = 'Manager'
            AND fk_colegio = public.produtos.fk_colegio
        )
    );
