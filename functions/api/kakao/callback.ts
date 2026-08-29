import type { Env } from './types';
import { exchangeCodeForKakaoUser } from './kakao-oauth';
import { createSupabaseClient } from '../../_shared/supabase';
import { findOrCreateUser } from './repository';

export async function onRequestGet({
  request,
  env,
}: {
  request: Request;
  env: Env;
}) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return new Response('코드가 유효하지 않습니다', { status: 400 });
  }

  const kakaoUser = await exchangeCodeForKakaoUser(code, env);
  const supabase = createSupabaseClient(env);
  const user = await findOrCreateUser(kakaoUser, supabase);

  return Response.json(user);
}
