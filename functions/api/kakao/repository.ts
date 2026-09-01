import type { KakaoUser } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function findOrCreateUser(
  kakaoUser: KakaoUser,
  supabaseClient: SupabaseClient
) {
  const { data, error } = await supabaseClient
    .from('users')
    .select()
    .eq('kakao_id', kakaoUser.id);

  if (!data) {
    throw new Error(`사용자 조회 실패: ${JSON.stringify(error)}`);
  }

  if (data.length === 0) {
    const { data: newData } = await supabaseClient
      .from('users')
      .insert({
        kakao_id: kakaoUser.id,
        nickname: kakaoUser.properties?.nickname,
      })
      .select();

    if (!newData) {
      throw new Error('사용자 생성에 실패');
    }
    return newData[0];
  } else {
    return data[0];
  }
}

export async function findUserById(
  userId: number,
  supabaseClient: SupabaseClient
) {
  const { data, error } = await supabaseClient
    .from('users')
    .select()
    .eq('id', userId);

  if (!data) {
    throw new Error(`조회 요청에 실패하였습니다: ${JSON.stringify(error)}`);
  }

  return data[0];
}
