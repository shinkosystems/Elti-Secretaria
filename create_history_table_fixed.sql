-- Create the elticoin_historico table with corrected types
-- We use BIGINT for fk_produto to match the existing produtos table ID type

DROP TABLE IF EXISTS public.elticoin_historico;

CREATE TABLE public.elticoin_historico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nome_produto TEXT, -- Optional, only if a product was exchanged
    fk_colegio INTEGER NOT NULL,
    fk_aluno INTEGER NOT NULL REFERENCES public.users(id),
    coins_removidas INTEGER NOT NULL,
    fk_produto BIGINT REFERENCES public.produtos(id), -- Changed to BIGINT to match produtos.id
    justificativa TEXT -- If no product, store the justification
);

-- Enable Row Level Security
ALTER TABLE public.elticoin_historico ENABLE ROW LEVEL SECURITY;

-- Policies for elticoin_historico table

-- 1. Everyone in the same school can view history
CREATE POLICY "Users can view coin history from their school" ON public.elticoin_historico
    FOR SELECT
    USING (
        fk_colegio IN (
            SELECT fk_colegio FROM public.users WHERE uuid = auth.uid()
        )
    );

-- 2. ALL users can insert history records for their school
CREATE POLICY "Users can insert coin history for their school" ON public.elticoin_historico
    FOR INSERT
    WITH CHECK (
        fk_colegio IN (
            SELECT fk_colegio FROM public.users WHERE uuid = auth.uid()
        )
    );
