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
}): Promise<Response> {
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

export async function onRequestPatch({
  request,
  env,
}: {
  request: Request;
  env: SupabaseEnv & SessionEnv;
}): Promise<Response> {
  const token = getCookie(request, 'token');

  if (!token) {
    return Response.json({ reason: '토큰이 없습니다' }, { status: 401 });
  }

  let userId: number;

  try {
    userId = await getUserIdFromToken(token, env);
  } catch {
    return Response.json({ reason: '토큰 위조 / 만료입니다' }, { status: 401 });
  }

  const body = (await request.json()) as {
    bank_name?: string;
    account_number?: string;
  };
  const bankName =
    typeof body.bank_name === 'string' ? body.bank_name.trim() : '';
  const accountNumber =
    typeof body.account_number === 'string' ? body.account_number.trim() : '';

  if (!bankName || !accountNumber) {
    return Response.json(
      { reason: '은행과 계좌번호를 모두 입력해주세요' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient(env);
  const { error } = await supabase
    .from('users')
    .update({ bank_name: bankName, account_number: accountNumber })
    .eq('id', userId);

  if (error) {
    throw new Error(`계좌 정보 저장에 실패하였습니다: ${JSON.stringify(error)}`);
  }

  return Response.json({});
}
