import { createSupabaseClient, type SupabaseEnv } from '../_shared/supabase';
import { getUserIdFromToken, type SessionEnv } from '../_shared/session';
import { getCookie } from '../_shared/http';
import { calculateRoomListItems, type Room } from '../../domain/rooms';

export async function onRequestGet({
  request,
  env,
}: {
  request: Request;
  env: SupabaseEnv & SessionEnv;
}): Promise<Response> {
  const token = getCookie(request, 'token');
  let viewerId: number;

  if (!token) {
    return Response.json({ reason: '토큰이 없습니다' }, { status: 401 });
  }

  try {
    viewerId = await getUserIdFromToken(token, env);
  } catch {
    return Response.json({ reason: '토큰 위조 / 만료입니다' }, { status: 401 });
  }

  const supabase = createSupabaseClient(env);

  const { data: myParticipantRows, error: participantError } = await supabase
    .from('participants')
    .select('room_id')
    .eq('user_id', viewerId);

  if (participantError) {
    throw new Error(
      `참여자 조회 요청에 실패하였습니다: ${JSON.stringify(participantError)}`
    );
  }

  const roomIds = myParticipantRows.map((row) => row.room_id);

  if (roomIds.length === 0) {
    return Response.json([]);
  }

  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('*, participants(*), items(*, item_checks(*))')
    .order('created_at', { ascending: false })
    .in('id', roomIds);

  if (roomsError) {
    throw new Error(
      `정산방 조회 요청에 실패하였습니다: ${JSON.stringify(roomsError)}`
    );
  }

  const roomListItems = calculateRoomListItems(rooms as Room[], viewerId);

  return Response.json(roomListItems);
}

export async function onRequestPost({
  request,
  env,
}: {
  request: Request;
  env: SupabaseEnv & SessionEnv;
}): Promise<Response> {
  const token = getCookie(request, 'token');
  let viewerId: number;

  if (!token) {
    return Response.json({ reason: '토큰이 없습니다' }, { status: 401 });
  }

  try {
    viewerId = await getUserIdFromToken(token, env);
  } catch {
    return Response.json({ reason: '토큰 위조 / 만료입니다' }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim();

  if (!name) {
    return Response.json(
      { reason: '모임 이름을 입력해주세요' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient(env);

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ name, host_id: viewerId })
    .select()
    .single();

  if (roomError) {
    throw new Error(`방 생성에 실패하였습니다: ${JSON.stringify(roomError)}`);
  }

  const { error: participantError } = await supabase
    .from('participants')
    .insert({ room_id: room.id, user_id: viewerId });

  if (participantError) {
    await supabase.from('rooms').delete().eq('id', room.id);
    throw new Error(
      `참여자 등록에 실패하였습니다: ${JSON.stringify(participantError)}`
    );
  }

  return Response.json({ id: room.id }, { status: 201 });
}
