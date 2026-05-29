
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('\n--- Checking User for UUID: 0ce1f2ae-b2f5-425f-bc15-c0d099fa163a ---');
    const { data: user, error: uError } = await supabase.from('users').select('nome, tipousuario').limit(5);
    if (uError) console.error('Users error:', uError);
    console.log(JSON.stringify(user, null, 2));
}

checkData();
