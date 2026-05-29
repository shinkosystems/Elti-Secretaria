import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL="(.*)"/)[1];
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY="(.*)"/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data } = await supabase.from('turmas').select('sala').limit(1);
  console.log("Turma:", data);
}
check();
