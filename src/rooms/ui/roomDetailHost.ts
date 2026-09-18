import { escapeHtml } from '../../shared/escapeHtml';
import styles from './roomDetailHost.module.css';

interface RoomDetailParticipant {
  name: string;
  isCompleted: boolean;
}

interface RenderRoomDetailHostHTMLParams {
  roomName: string;
  hostName: string;
  totalAmount: number;
  myTotal: number;
  participants: RoomDetailParticipant[];
}

interface RoomDetailResponse {
  name: string;
  host_id: number;
  participants: {
    user_id: number;
    users: { nickname: string };
  }[];
}

export function renderRoomDetailHostHTML({
  roomName,
  hostName,
  totalAmount,
  myTotal,
  participants,
}: RenderRoomDetailHostHTMLParams): string {
  const allCompleted = participants.every(
    (participant) => participant.isCompleted
  );

  const participantBadges = participants
    .map((participant) => {
      const completedClass = participant.isCompleted
        ? styles['participantBadge--completed']
        : '';
      const checkMark = participant.isCompleted ? '✓ ' : '';

      return `<span class="${styles.participantBadge} ${completedClass}">${checkMark}${escapeHtml(participant.name)}</span>`;
    })
    .join('');

  return `
    <div class="${styles.page}">
      <header class="${styles.header}">
        <div class="${styles.headerLeft}">
          <button id="back-button" class="${styles.backButton}" type="button" aria-label="뒤로가기">‹</button>
          <h1 class="${styles.title}">${escapeHtml(roomName)}</h1>
        </div>
        <button class="${styles.shareButton}" type="button">링크 공유</button>
      </header>

      <div class="${styles.summary}">
        <div class="${styles.summaryRow}">
          <span>방장 ${escapeHtml(hostName)}</span>
          <span class="${styles.summaryTotal}">합계 ${totalAmount.toLocaleString()}원</span>
        </div>
        <div class="${styles.participants}">
          ${participantBadges}
        </div>
      </div>

      <p class="${styles.notice}">⚠️ 1인 금액은 백원 단위로 올림 처리돼요</p>

      <div class="${styles.emptyState}">
        <p class="${styles.emptyStateIcon}">🧾</p>
        <p class="${styles.emptyStateText}">항목을 추가해주세요</p>
      </div>

      <div class="${styles.myTotal}">
        <span class="${styles.myTotalLabel}">나의 합계</span>
        <span class="${styles.myTotalAmount}">${myTotal.toLocaleString()}원</span>
      </div>

      <div class="${styles.footer}">
        <button class="${styles.addButton}" type="button">+ 항목 추가</button>
        <button class="${styles.completeButton}" type="button" ${allCompleted ? '' : 'disabled'}>정산 완료</button>
      </div>
    </div>
  `;
}

export async function renderRoomDetailHost(
  root: HTMLElement,
  id: string,
  navigate: (path: string) => void
): Promise<void> {
  try {
    const response = await fetch(`/api/rooms/${id}`);

    if (!response.ok) {
      throw new Error('정산방 상세 내용을 불러오지 못했습니다');
    }

    const data = (await response.json()) as RoomDetailResponse;

    const roomName = data.name;
    const hostUser = data.participants.find((participant) => {
      return participant.user_id === data.host_id;
    });

    if (!hostUser) {
      throw new Error('방장이 참여자 목록에 없습니다');
    }

    const hostName = hostUser.users.nickname;
    const totalAmount = 0;
    const myTotal = 0;
    const participants = data.participants.map((participant) => {
      return { name: participant.users.nickname, isCompleted: false };
    });

    root.innerHTML = renderRoomDetailHostHTML({
      roomName,
      hostName,
      totalAmount,
      myTotal,
      participants,
    });

    const backButton = root.querySelector('#back-button');
    backButton.addEventListener('click', () => {
      navigate('/rooms');
    });
  } catch {
    root.innerHTML = '정산방 상세 화면 불러오기에 실패하였습니다';
  }

  return;
}
