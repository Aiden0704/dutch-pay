import type { SupabaseClient } from '@supabase/supabase-js';

export interface User {
  id: number;
  kakao_id: number;
  nickname?: string;
  created_at: string;
  bank_name: string | null;
  account_number: string | null;
}

export async function findUserById(
  userId: number,
  supabaseClient: SupabaseClient
): Promise<User | undefined> {
  const { data, error } = await supabaseClient
    .from('users')
    .select()
    .eq('id', userId);

  if (!data) {
    throw new Error(`조회 요청에 실패하였습니다: ${JSON.stringify(error)}`);
  }

  return data[0];
}
