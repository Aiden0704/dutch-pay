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
  const select = '*, participants(*, users(nickname)), items(*, item_checks(*))';

  const { data, error: roomError } = await supabase
    .from('rooms')
    .select(select)
    .order('id', { referencedTable: 'items.item_checks' })
    .eq('id', params.id)
    .single();

  if (roomError && roomError.code === 'PGRST116') {
    return Response.json(
      {
        reason: '조회된 방이 없습니다',
      },
      { status: 404 }
    );
  }

  if (roomError) {
    throw new Error(`정산방 조회에 실패하였습니다: ${JSON.stringify(roomError)}`);
  }

  let room = data as Room;

  const isParticipant = room.participants.find((participant) => {
    return viewerId === participant.user_id;
  });

  if (!isParticipant) {
    const { error: joinError } = await supabase
      .from('participants')
      .insert({ room_id: params.id, user_id: viewerId });

    if (joinError) {
      throw new Error(`참여자 등록에 실패하였습니다: ${JSON.stringify(joinError)}`);
    }

    const { data: rejoined, error: rejoinError } = await supabase
      .from('rooms')
      .select(select)
      .order('id', { referencedTable: 'items.item_checks' })
      .eq('id', params.id)
      .single();

    if (rejoinError) {
      throw new Error(
        `정산방 재조회에 실패하였습니다: ${JSON.stringify(rejoinError)}`
      );
    }

    room = rejoined as Room;
  }

  const roomDetail = calculateRoomDetail(room, viewerId);
  const rawParticipants = room.participants as unknown as SupabaseParticipant[];
  const sortedParticipants = [...rawParticipants].sort((a, b) => {
    if (a.user_id === room.host_id) return -1;
    if (b.user_id === room.host_id) return 1;
    return a.id - b.id;
  });

  const participants = sortedParticipants.map((participant) => {
    const detail = roomDetail.participants.find((p) => p.id === participant.id);

    if (!detail) {
      throw new Error('참여자 계산 결과를 찾을 수 없습니다');
    }

    return {
      user_id: participant.user_id,
      users: participant.users,
      isCompleted: detail.isCompleted,
      amount: detail.amount,
    };
  });

  const items = room.items.map((item) => {
    const checkedParticipants = item.item_checks
      .map((check) =>
        rawParticipants.find(
          (participant) => participant.id === check.participant_id
        )
      )
      .filter((participant): participant is SupabaseParticipant => {
        return participant !== undefined;
      })
      .map((participant) => ({
        user_id: participant.user_id,
        name: participant.users.nickname,
      }));

    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      amount: item.amount,
      checkedParticipants,
    };
  });

  return Response.json({
    name: room.name,
    host_id: room.host_id,
    viewer_id: viewerId,
    totalAmount: roomDetail.totalAmount,
    myAmount: roomDetail.myAmount,
    isSettled: roomDetail.isSettled,
    readyToSettle: roomDetail.readyToSettle,
    participants,
    items,
  });
}
