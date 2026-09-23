import { renderRoomDetailHost } from './roomDetailHost';
import { renderRoomDetailParticipant } from './roomDetailParticipant';
import { renderRoomSettlementSummary } from '../settlement/roomSettlementSummary';

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

export async function renderRoomDetail(
  root: HTMLElement,
  id: string,
  navigate: (path: string) => void
): Promise<void> {
  try {
    const data = await fetchRoomDetail(id);

    if (data.isSettled) {
      renderRoomSettlementSummary(root, data, navigate);
    } else if (data.viewer_id === data.host_id) {
      renderRoomDetailHost(root, data, id, navigate);
    } else {
      renderRoomDetailParticipant(root, data, id, navigate);
    }
  } catch {
    root.innerHTML = '정산방 상세 화면 불러오기에 실패하였습니다';
  }
}
