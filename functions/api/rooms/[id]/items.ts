import { getCookie } from '../../../_shared/http';
import { getUserIdFromToken, type SessionEnv } from '../../../_shared/session';
import { createSupabaseClient, type SupabaseEnv } from '../../../_shared/supabase';

interface ItemInput {
  name?: string;
  quantity?: number;
  amount?: number;
}

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

  const body = (await request.json()) as { items?: ItemInput[] };
  const items = body.items ?? [];

  if (items.length === 0) {
    return Response.json({ reason: '추가할 항목이 없습니다' }, { status: 400 });
  }

  const rows = items.map((item) => ({
    room_id: params.id,
    name: item.name?.trim() ?? '',
    quantity: item.quantity ?? 0,
    amount: item.amount ?? 0,
  }));

  const isInvalid = rows.some(
    (row) => !row.name || row.quantity < 1 || row.amount < 1
  );

  if (isInvalid) {
    return Response.json(
      { reason: '항목명, 개수, 단가를 모두 입력해주세요' },
      { status: 400 }
    );
  }

  const isOutOfRange = rows.some(
    (row) => row.quantity > 999 || row.amount > 10000000
  );

  if (isOutOfRange) {
    return Response.json(
      { reason: '개수는 999개, 단가는 1000만원을 넘을 수 없습니다' },
      { status: 400 }
    );
  }

  const { data: created, error: itemsError } = await supabase
    .from('items')
    .insert(rows)
    .select();

  if (itemsError) {
    throw new Error(`항목 생성에 실패하였습니다: ${JSON.stringify(itemsError)}`);
  }

  return Response.json(created, { status: 201 });
}
