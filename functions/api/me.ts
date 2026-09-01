import { createSupabaseClient, type SupabaseEnv } from '../_shared/supabase';
import { verifyJwtToken, type SessionEnv } from '../_shared/session';
import { getCookie } from '../_shared/http';
import { findUserById } from './kakao/repository';

export async function onRequestGet({
  request,
  env,
}: {
  request: Request;
  env: SupabaseEnv & SessionEnv;
}) {
  const token = getCookie(request, 'token');

  if (!token) {
    return Response.json({ loggedIn: false });
  }

  try {
    const userId = await verifyJwtToken(token, env);
    const supabase = createSupabaseClient(env);
    const user = await findUserById(userId, supabase);

    return Response.json({ loggedIn: true, user });
  } catch {
    return Response.json({ loggedIn: false });
  }
}
