import { getCookie } from '../../../../_shared/http';
import { getUserIdFromToken, type SessionEnv } from '../../../../_shared/session';
import {
  createSupabaseClient,
  type SupabaseEnv,
} from '../../../../_shared/supabase';

export async function onRequestDelete({
  request,
  env,
  params,
}: {
  request: Request;
  env: SupabaseEnv & SessionEnv;
  params: { id: string; itemId: string };
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
    .select('host_id')
    .eq('id', params.id)
    .maybeSingle();

  if (roomError) {
    throw new Error(`방 조회에 실패하였습니다: ${JSON.stringify(roomError)}`);
  }

  if (!room) {
    return Response.json({ reason: '조회된 방이 없습니다' }, { status: 404 });
  }

  if (room.host_id !== viewerId) {
    return Response.json(
      { reason: '방장만 삭제할 수 있습니다' },
      { status: 403 }
    );
  }

  const { error: checksDeleteError } = await supabase
    .from('item_checks')
    .delete()
    .eq('item_id', params.itemId);

  if (checksDeleteError) {
    throw new Error(
      `체크 삭제에 실패하였습니다: ${JSON.stringify(checksDeleteError)}`
    );
  }

  const { error: itemDeleteError } = await supabase
    .from('items')
    .delete()
    .eq('id', params.itemId)
    .eq('room_id', params.id);

  if (itemDeleteError) {
    throw new Error(
      `항목 삭제에 실패하였습니다: ${JSON.stringify(itemDeleteError)}`
    );
  }

  return Response.json({});
}
