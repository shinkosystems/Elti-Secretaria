import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL="(.*)"/)[1];
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY="(.*)"/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data: salasData, error: salasError } = await supabase.from('salas').select('*').limit(5);
    console.log("Salas table:", salasData ? salasData : salasError?.message);
  } catch (e) {
    console.log("Error checking salas table", e.message);
  }

  const { data: turmasData } = await supabase.from('turmas').select('sala').not('sala', 'is', null);
  const uniqueSalas = [...new Set(turmasData?.map(t => t.sala).filter(Boolean))];
  console.log("Unique salas in turmas:", uniqueSalas);
}
check();
