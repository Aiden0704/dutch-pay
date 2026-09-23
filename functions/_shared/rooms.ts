import type { createSupabaseClient } from './supabase';

export async function assertRoomNotSettled(
  supabase: ReturnType<typeof createSupabaseClient>,
  roomId: string
): Promise<Response | null> {
  const { data: room, error } = await supabase
    .from('rooms')
    .select('is_settled')
    .eq('id', roomId)
    .maybeSingle();

  if (error) {
    throw new Error(`방 정보 조회에 실패하였습니다: ${JSON.stringify(error)}`);
  }

  if (room?.is_settled) {
    return Response.json(
      { reason: '이미 정산 완료된 방입니다' },
      { status: 400 }
    );
  }

  return null;
}
