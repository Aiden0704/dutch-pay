import type { Env } from './types';
import { redirectWithCookie } from '../../_shared/http';

export function onRequestGet({ env }: { env: Env }) {
  const randomValue = crypto.randomUUID();

  const restApiKey = env.KAKAO_REST_API_KEY;
  const redirectUri = env.KAKAO_REDIRECT_URI;

  const url = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${restApiKey}&redirect_uri=${redirectUri}&state=${randomValue}`;

  return redirectWithCookie({
    location: url,
    cookieName: 'state',
    cookieValue: randomValue,
    maxAge: 300,
  });
}
