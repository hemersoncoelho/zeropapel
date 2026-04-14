import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = ''; // We will use service_role key to bypass RLS

envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  const value = values.join('=');
  if (key === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
  // using anon key since I don't have service_role right now
  if (key === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value.trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users, error } = await supabase.from('profiles').select('*');
  console.log("Profiles raw:", users);
}
run();
