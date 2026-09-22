import { getCookie } from '../../../_shared/http';
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

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, host_id')
    .eq('id', params.id)
    .maybeSingle();

  if (roomError) {
    throw new Error(`정산방 조회에 실패하였습니다: ${JSON.stringify(roomError)}`);
  }

  if (!room) {
    return Response.json({ reason: '조회된 방이 없습니다' }, { status: 404 });
  }

  if (room.host_id !== viewerId) {
    return Response.json({ reason: '방장만 정산을 완료할 수 있습니다' }, { status: 403 });
  }

  const { data: participants, error: participantsError } = await supabase
    .from('participants')
    .select('user_id, is_completed')
    .eq('room_id', params.id);

  if (participantsError) {
    throw new Error(
      `참여자 조회에 실패하였습니다: ${JSON.stringify(participantsError)}`
    );
  }

  const nonHostParticipants = (participants ?? []).filter(
    (participant) => participant.user_id !== room.host_id
  );
  const allCompleted =
    nonHostParticipants.length > 0 &&
    nonHostParticipants.every((participant) => participant.is_completed);

  if (!allCompleted) {
    return Response.json(
      { reason: '모든 참여자가 선택 완료를 눌러야 정산할 수 있습니다' },
      { status: 400 }
    );
  }

  const { error: settleError } = await supabase
    .from('rooms')
    .update({ is_settled: true })
    .eq('id', params.id);

  if (settleError) {
    throw new Error(`정산 완료 처리에 실패하였습니다: ${JSON.stringify(settleError)}`);
  }

  return Response.json({});
}
