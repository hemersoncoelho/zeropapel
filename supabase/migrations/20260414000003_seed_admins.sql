-- Insere o usuário admin diretamente pelo SQL para evitar bloqueios de RLS ou falhas na UI
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Tenta encontrar o usuário pelo email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'hemersoncoelho21@gmail.com';

  -- Se encontrou o auth user, coloca na platform_admins ignorando RLS
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.platform_admins (user_id)
    VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- Tenta também o admin@zeropapel.com.br
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@zeropapel.com.br';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.platform_admins (user_id)
    VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;
