import { renderRoomDetailHost } from './roomDetailHost';
import { renderRoomDetailParticipant } from './roomDetailParticipant';
import { renderRoomSettlementSummary } from '../settlement/roomSettlementSummary';
import { pollHostRoom, pollSettlement, stopRoomPolling } from './roomPolling';

export interface RoomDetailResponse {
  name: string;
  host_id: number;
  viewer_id: number;
  totalAmount: number;
  myAmount: number;
  isSettled: boolean;
  readyToSettle: boolean;
  hostBankName: string | null;
  hostAccountNumber: string | null;
  participants: {
    user_id: number;
    users: { nickname: string };
    isCompleted: boolean;
    amount: number;
  }[];
  items: {
    id: number;
    name: string;
    quantity: number;
    amount: number;
    checkedParticipants: { user_id: number; name: string }[];
  }[];
}

export async function fetchRoomDetail(id: string): Promise<RoomDetailResponse> {
  const response = await fetch(`/api/rooms/${id}`);

  if (!response.ok) {
    throw new Error('정산방 상세 내용을 불러오지 못했습니다');
  }

  return (await response.json()) as RoomDetailResponse;
}

function showRoomDetail(
  root: HTMLElement,
  data: RoomDetailResponse,
  id: string,
  navigate: (path: string) => void
): void {
  const refresh = (latest: RoomDetailResponse) =>
    showRoomDetail(root, latest, id, navigate);

  if (data.isSettled) {
    stopRoomPolling();
    renderRoomSettlementSummary(root, data, navigate);
    return;
  }

  if (data.viewer_id === data.host_id) {
    pollHostRoom(root, id, data, refresh);
    renderRoomDetailHost(root, data, id, navigate);
    return;
  }

  const viewer = data.participants.find(
    (participant) => participant.user_id === data.viewer_id
  );

  if (viewer?.isCompleted) {
    pollSettlement(root, id, refresh);
  } else {
    stopRoomPolling();
  }
  renderRoomDetailParticipant(root, data, id, navigate);
}

export function watchSettlement(
  root: HTMLElement,
  id: string,
  navigate: (path: string) => void
): void {
  pollSettlement(root, id, (latest) =>
    showRoomDetail(root, latest, id, navigate)
  );
}

export async function renderRoomDetail(
  root: HTMLElement,
  id: string,
  navigate: (path: string) => void
): Promise<void> {
  try {
    const data = await fetchRoomDetail(id);

    showRoomDetail(root, data, id, navigate);
  } catch {
    root.innerHTML = '정산방 상세 화면 불러오기에 실패하였습니다';
  }
}
