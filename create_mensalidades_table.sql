-- Create mensalidades table
CREATE TABLE IF NOT EXISTS public.mensalidades (
    id BIGSERIAL PRIMARY KEY,
    fk_usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fk_colegio BIGINT NOT NULL,
    mes_referencia TEXT NOT NULL, -- Format: "MM/YYYY", e.g. "03/2024"
    valor DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'Pendente', -- Values: 'Pago', 'Pendente', 'Atrasado'
    metodo_pagamento TEXT, -- Values: 'Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto'
    data_vencimento DATE NOT NULL,
    data_pagamento TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for mensalidades
ALTER TABLE public.mensalidades ENABLE ROW LEVEL SECURITY;

-- Create policies for mensalidades
CREATE POLICY "Users can view mensalidades of their school" ON public.mensalidades
    FOR SELECT USING (
        fk_colegio = (SELECT fk_colegio FROM public.users WHERE uuid = auth.uid())
    );

CREATE POLICY "Managers can manage mensalidades for their school" ON public.mensalidades
    FOR ALL USING (
        fk_colegio = (SELECT fk_colegio FROM public.users WHERE uuid = auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE uuid = auth.uid() 
            AND tipousuario = 'Manager'
        )
    );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mensalidades_aluno_mes ON public.mensalidades(fk_usuario, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_mensalidades_colegio ON public.mensalidades(fk_colegio);
