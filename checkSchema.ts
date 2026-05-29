import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    console.log('--- Users ---');
    const { data: userData, error: userError } = await supabase.from('users').select('*').limit(1);
    if (userError) console.error('Users Error:', userError);
    else console.log('Columns:', Object.keys(userData[0] || {}));

    console.log('--- Turmas ---');
    const { data: turmasData, error: turmasError } = await supabase.from('turmas').select('*');
    if (turmasError) console.error('Turmas Error:', turmasError);
    else console.log('Data:', JSON.stringify(turmasData, null, 2));

    console.log('--- Aulas ---');
    const { data: aulasData, error: aulasError } = await supabase.from('aulas').select('*').limit(1);
    if (aulasError) console.error('Aulas Error:', aulasError);
    else console.log('Columns:', Object.keys(aulasData[0] || {}));

    console.log('--- Produtos ---');
    const { data: produtosData, error: produtosError } = await supabase.from('produtos').select('*').limit(1);
    if (produtosError) console.error('Produtos Error:', produtosError);
    else console.log('Columns:', Object.keys(produtosData[0] || {}));
}

checkSchema();
