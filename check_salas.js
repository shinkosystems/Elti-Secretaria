import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: tableData } = await supabase.from('salas').select('*').limit(1).catch(() => ({}));
  if (tableData) console.log("Salas table exists", tableData);
  else console.log("No salas table");

  const { data } = await supabase.from('turmas').select('sala').not('sala', 'is', null);
  console.log("Turmas salas: ", data ? [...new Set(data.map(d => d.sala))] : []);
}
check();
