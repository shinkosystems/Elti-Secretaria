-- Create materiais table
CREATE TABLE IF NOT EXISTS public.materiais (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    fk_colegio BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for materiais
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;

-- Create policies for materiais
CREATE POLICY "Users can view materials of their school" ON public.materiais
    FOR SELECT USING (
        fk_colegio = (SELECT fk_colegio FROM public.users WHERE uuid = auth.uid())
    );

CREATE POLICY "Managers can insert materials for their school" ON public.materiais
    FOR INSERT WITH CHECK (
        fk_colegio = (SELECT fk_colegio FROM public.users WHERE uuid = auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE uuid = auth.uid() 
            AND tipousuario = 'Manager'
        )
    );

-- Create pedidos_materiais table
-- We use a text status column instead of boolean entregue
CREATE TABLE IF NOT EXISTS public.pedidos_materiais (
    id BIGSERIAL PRIMARY KEY,
    fk_colegio BIGINT NOT NULL,
    fk_usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Pedido Feito', -- Values: 'Pedido Feito', 'Em Processamento', 'Entregue', 'Negado'
    data_pedido TIMESTAMPTZ DEFAULT NOW(),
    data_entrega TIMESTAMPTZ, -- Set when status becomes 'Entregue'
    item_nome TEXT NOT NULL,
    fk_material BIGINT REFERENCES public.materiais(id) ON DELETE SET NULL
);

-- Enable RLS for pedidos_materiais
ALTER TABLE public.pedidos_materiais ENABLE ROW LEVEL SECURITY;

-- Create policies for pedidos_materiais
CREATE POLICY "Users can view orders from their school" ON public.pedidos_materiais
    FOR SELECT USING (
        fk_colegio = (SELECT fk_colegio FROM public.users WHERE uuid = auth.uid())
    );

CREATE POLICY "Users can create orders for their school" ON public.pedidos_materiais
    FOR INSERT WITH CHECK (
        fk_colegio = (SELECT fk_colegio FROM public.users WHERE uuid = auth.uid())
    );

CREATE POLICY "Managers can update orders from their school" ON public.pedidos_materiais
    FOR UPDATE USING (
        fk_colegio = (SELECT fk_colegio FROM public.users WHERE uuid = auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE uuid = auth.uid() 
            AND tipousuario = 'Manager'
        )
    );
