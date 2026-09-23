import { getCookie } from '../../../_shared/http';
import { assertRoomNotSettled } from '../../../_shared/rooms';
import { getUserIdFromToken, type SessionEnv } from '../../../_shared/session';
import { createSupabaseClient, type SupabaseEnv } from '../../../_shared/supabase';

export async function onRequestPost({
  request,
  env,
  params,
}: {
  request: Request;
  env: SupabaseEnv & SessionEnv;
  params: { id: string };
}): Promise<Response> {
  const token = getCookie(request, 'token');

  if (!token) {
    return Response.json({ reason: '토큰이 없습니다' }, { status: 401 });
  }

  let viewerId: number;

  try {
    viewerId = await getUserIdFromToken(token, env);
  } catch {
    return Response.json({ reason: '토큰 위조 / 만료입니다' }, { status: 401 });
  }

  const supabase = createSupabaseClient(env);

  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id')
    .eq('room_id', params.id)
    .eq('user_id', viewerId)
    .maybeSingle();

  if (participantError) {
    throw new Error(
      `참여자 조회에 실패하였습니다: ${JSON.stringify(participantError)}`
    );
  }

  if (!participant) {
    return Response.json(
      { reason: '이 방의 참여자가 아닙니다' },
      { status: 403 }
    );
  }

  const settledResponse = await assertRoomNotSettled(supabase, params.id);

  if (settledResponse) {
    return settledResponse;
  }

  const { error: updateError } = await supabase
    .from('participants')
    .update({ is_completed: true })
    .eq('id', participant.id);

  if (updateError) {
    throw new Error(`완료 처리에 실패하였습니다: ${JSON.stringify(updateError)}`);
  }

  return Response.json({});
}
