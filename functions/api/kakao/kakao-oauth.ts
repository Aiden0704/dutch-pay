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

async function getKakaoUserInfo(accessToken: string) {
  const url = 'https://kapi.kakao.com/v2/user/me';
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });
  return response;
}

export async function exchangeCodeForKakaoUser(code: string, env: Env) {
  const tokenResponse = await exchangeCodeForToken(code, env);
  const token = await tokenResponse.json();

  const userInfoResponse = await getKakaoUserInfo(token.access_token);
  return await userInfoResponse.json();
}
