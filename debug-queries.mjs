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
  // Try logging in to get the token, or we can just try grabbing companies 
  // with a hardcoded user token? The user ID might be f441742d-fcc2-4e9e-8230-145a77774790
  // Instead of logging in, I'll login with admin@zeropapel.com.br / 123456
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@zeropapel.com.br',
    password: '123456'
  });
  
  // Try alternative email from user msg: hemersoncoelho21@gmail.com
  if (authErr) {
    const { data: auth2, error: authErr2 } = await supabase.auth.signInWithPassword({
      email: 'hemersoncoelho21@gmail.com',
      password: '123456'
    });
  }

  console.log("Fetching profiles...");
  const p = await supabase.from('profiles').select('*').limit(1);
  console.log(p.error);

  console.log("Fetching companies...");
  const c = await supabase.from('companies').select('*');
  console.log(c.error);
}

run();
