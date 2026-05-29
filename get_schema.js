import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('get_tables_names').catch(() => ({}));
  console.log("RPC: ", data, error);
  // Alternative: query information_schema if allowed
  const { data: cols } = await supabase.from('turmas').select('*').limit(1);
  console.log("Turmas columns: ", cols ? Object.keys(cols[0] || {}) : 'error');
}
check();
