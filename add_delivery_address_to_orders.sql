ALTER TABLE public.pedidos_materiais 
ADD COLUMN IF NOT EXISTS endereco_entrega TEXT,
ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT,
ADD COLUMN IF NOT EXISTS quantidade_parcelas INTEGER DEFAULT 1;

-- Update existing records if any
UPDATE public.pedidos_materiais 
SET endereco_entrega = 'Retirada na Escola' 
WHERE endereco_entrega IS NULL;
