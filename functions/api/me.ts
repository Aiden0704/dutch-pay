import { createSupabaseClient, type SupabaseEnv } from '../_shared/supabase';
import { getUserIdFromToken, type SessionEnv } from '../_shared/session';
import { getCookie } from '../_shared/http';
import { findUserById } from '../_shared/users';

export async function onRequestGet({
  request,
  env,
}: {
  request: Request;
  env: SupabaseEnv & SessionEnv;
}) {
  const token = getCookie(request, 'token');
  const supabase = createSupabaseClient(env);
  let userId: number;

  if (!token) {
    return Response.json({ loggedIn: false, reason: '토큰이 없습니다' });
  }

  try {
    userId = await getUserIdFromToken(token, env);
  } catch {
    return Response.json({ loggedIn: false, reason: '토큰 위조 / 만료입니다' });
  }

  const user = await findUserById(userId, supabase);

  if (user === undefined) {
    return Response.json({
      loggedIn: false,
      reason: '토큰은 유효하지만 DB에 유저가 없습니다',
    });
  }

  return Response.json({ loggedIn: true, user });
}
