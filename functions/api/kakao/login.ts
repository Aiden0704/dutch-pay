import type { Env } from './types';

export function onRequestGet({ env }: { env: Env }) {
  const randomValue = crypto.randomUUID();

  const restApiKey = env.KAKAO_REST_API_KEY;
  const redirectUri = env.KAKAO_REDIRECT_URI;

  const url = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${restApiKey}&redirect_uri=${redirectUri}&state=${randomValue}`;

  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': `state=${randomValue}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=300;`,
      Location: url,
    },
  });
}
