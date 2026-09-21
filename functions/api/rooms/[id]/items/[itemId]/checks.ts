import { getCookie } from '../../../../../_shared/http';
import { getUserIdFromToken, type SessionEnv } from '../../../../../_shared/session';
import {
  createSupabaseClient,
  type SupabaseEnv,
} from '../../../../../_shared/supabase';

type Env = SupabaseEnv & SessionEnv;
type Params = { id: string; itemId: string };

async function resolveParticipantId(
  request: Request,
  env: Env,
  roomId: string
): Promise<{ participantId: number } | Response> {
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
    .eq('room_id', roomId)
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

  return { participantId: participant.id };
}

export async function onRequestPost({
  request,
  env,
  params,
}: {
  request: Request;
  env: Env;
  params: Params;
}): Promise<Response> {
  const resolved = await resolveParticipantId(request, env, params.id);

  if (resolved instanceof Response) {
    return resolved;
  }

  const supabase = createSupabaseClient(env);

  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id')
    .eq('id', params.itemId)
    .eq('room_id', params.id)
    .maybeSingle();

  if (itemError) {
    throw new Error(`항목 조회에 실패하였습니다: ${JSON.stringify(itemError)}`);
  }

  if (!item) {
    return Response.json({ reason: '항목을 찾을 수 없습니다' }, { status: 404 });
  }

  const { error: insertError } = await supabase.from('item_checks').insert({
    item_id: params.itemId,
    participant_id: resolved.participantId,
    paid: false,
  });

  if (insertError) {
    throw new Error(`체크에 실패하였습니다: ${JSON.stringify(insertError)}`);
  }

  return Response.json({}, { status: 201 });
}

export async function onRequestDelete({
  request,
  env,
  params,
}: {
  request: Request;
  env: Env;
  params: Params;
}): Promise<Response> {
  const resolved = await resolveParticipantId(request, env, params.id);

  if (resolved instanceof Response) {
    return resolved;
  }

  const supabase = createSupabaseClient(env);

  const { error: deleteError } = await supabase
    .from('item_checks')
    .delete()
    .eq('item_id', params.itemId)
    .eq('participant_id', resolved.participantId);

  if (deleteError) {
    throw new Error(`체크 해제에 실패하였습니다: ${JSON.stringify(deleteError)}`);
  }

  return Response.json({});
}
