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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Anon Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkIntegration() {
  console.log("Verificando conexão com Supabase...");
  console.log("URL:", supabaseUrl);
  
  // Try to query a table or just check auth health
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
         console.log("Conectado! (Tabela profiles ainda não existe, mas a conexão foi feita).");
      } else {
         console.error("Erro ao consultar:", error.message);
      }
    } else {
      console.log("Conexão bem sucedida. Integracão funcionando!");
      console.log("Dados (profiles):", data);
    }
  } catch(e) {
    console.error("Erro inesperado:", e);
  }
}

checkIntegration();
