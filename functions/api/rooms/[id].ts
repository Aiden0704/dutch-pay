import { getCookie } from '../../_shared/http';
import { getUserIdFromToken, type SessionEnv } from '../../_shared/session';
import { createSupabaseClient, type SupabaseEnv } from '../../_shared/supabase';
import { calculateRoomDetail, type Room } from '../../../domain/rooms';

interface SupabaseParticipant {
  id: number;
  user_id: number;
  users: { nickname: string };
}

export async function onRequestGet({
  request,
  env,
  params,
}: {
  request: Request;
  env: SupabaseEnv & SessionEnv;
  params: { id: string };
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

  const { data, error: roomError } = await supabase
    .from('rooms')
    .select('*, participants(*, users(nickname)), items(*, item_checks(*))')
    .eq('id', params.id)
    .single();

  if (roomError) {
    return Response.json(
      {
        reason: '조회된 방이 없습니다',
      },
      { status: 404 }
    );
  }

  const room = data as Room;

  const isParticipant = room.participants.find((participant) => {
    return viewerId === participant.user_id;
  });

  if (!isParticipant) {
    return Response.json(
      {
        reason: '이 방의 참여자가 아닙니다',
      },
      { status: 403 }
    );
  }

  const roomDetail = calculateRoomDetail(room, viewerId);
  const rawParticipants = room.participants as unknown as SupabaseParticipant[];

  const participants = rawParticipants.map((participant) => {
    const detail = roomDetail.participants.find((p) => p.id === participant.id);

    if (!detail) {
      throw new Error('참여자 계산 결과를 찾을 수 없습니다');
    }

    return {
      user_id: participant.user_id,
      users: participant.users,
      isCompleted: detail.isCompleted,
    };
  });

  return Response.json({
    name: room.name,
    host_id: room.host_id,
    totalAmount: roomDetail.totalAmount,
    myAmount: roomDetail.myAmount,
    participants,
  });
}
