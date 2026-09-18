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
          <button class="${styles.backButton}" type="button" aria-label="뒤로가기">‹</button>
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
