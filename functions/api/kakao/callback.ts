import type { Env } from './types';
import { exchangeCodeForKakaoUser } from './kakao-oauth';
import { createSupabaseClient } from '../../_shared/supabase';
import { findOrCreateUser } from './repository';
import { createJwtToken } from '../../_shared/session';

export async function onRequestGet({
  request,
  env,
}: {
  request: Request;
  env: Env;
}) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return new Response('코드가 유효하지 않습니다', { status: 400 });
    }

    const kakaoUser = await exchangeCodeForKakaoUser(code, env);
    const supabase = createSupabaseClient(env);
    const user = await findOrCreateUser(kakaoUser, supabase);
    const jwtToken = await createJwtToken(user.id, env);

    return new Response(null, {
      status: 302,
      headers: {
        'Set-Cookie': `token=${jwtToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
        Location: '/',
      },
    });
  } catch {
    return Response.redirect('/?error=login_failed', 302);
  }
}
