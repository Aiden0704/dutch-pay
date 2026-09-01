import type { Env } from './types';
import { exchangeCodeForKakaoUser } from './kakao-oauth';
import { createSupabaseClient } from '../../_shared/supabase';
import { findOrCreateUser } from './repository';
import { createJwtToken } from '../../_shared/session';
import { redirectWithCookie, getCookie } from '../../_shared/http';

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
    const queryState = searchParams.get('state');
    const cookieState = getCookie(request, 'state');

    if (!code) {
      return new Response('코드가 유효하지 않습니다', { status: 400 });
    }

    if (!cookieState || cookieState !== queryState) {
      return new Response('잘못된 요청입니다', { status: 400 });
    }

    const kakaoUser = await exchangeCodeForKakaoUser(code, env);
    const supabase = createSupabaseClient(env);
    const user = await findOrCreateUser(kakaoUser, supabase);
    const jwtToken = await createJwtToken(user.id, env);

    return redirectWithCookie({
      location: '/',
      cookieName: 'token',
      cookieValue: jwtToken,
      maxAge: 604800,
    });
  } catch {
    return Response.redirect('/?error=login_failed', 302);
  }
}
