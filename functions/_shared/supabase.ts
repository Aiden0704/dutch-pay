import { createClient } from '@supabase/supabase-js';

export interface SupabaseEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export function createSupabaseClient(env: SupabaseEnv) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}
