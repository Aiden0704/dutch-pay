import type { Env } from './types';

async function exchangeCodeForToken(code: string, env: Env) {
  const url = 'https://kauth.kakao.com/oauth/token';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.KAKAO_REST_API_KEY,
      client_secret: env.KAKAO_CLIENT_SECRET,
      redirect_uri: env.KAKAO_REDIRECT_URI,
      code: code,
    }),
  });

  return response;
}

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

  const response = await exchangeCodeForToken(code, env);
  const token = await response.json();

  return Response.json(token);
}
