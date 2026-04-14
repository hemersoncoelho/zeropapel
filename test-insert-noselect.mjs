import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseAnonKey = '';

envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  const value = values.join('=');
  if (key === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
  if (key === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = value.trim();
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: 'Test Company',
      plan: 'free',
      is_active: true,
    })
  
  console.log("Insert response (no select):", data, error);
}

run();
