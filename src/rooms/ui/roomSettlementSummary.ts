import backIcon from '../../assets/icons/back.svg?raw';
import checkIcon from '../../assets/icons/check.svg?raw';
import { escapeHtml } from '../../shared/escapeHtml';
import type { RoomDetailResponse } from './roomDetail';
import styles from './roomSettlementSummary.module.css';

function buildTossSendLink(
  bankName: string,
  accountNumber: string,
  amount: number
): string {
  const normalizedBank = bankName.endsWith('은행')
    ? bankName.slice(0, -2)
    : bankName;
  const digitsOnlyAccount = accountNumber.replace(/[^0-9]/g, '');

  const params = new URLSearchParams({
    bank: normalizedBank,
    accountNo: digitsOnlyAccount,
    amount: String(amount),
  });

  return `supertoss://send?${params.toString()}`;
}

export function renderRoomSettlementSummaryHTML(
  data: RoomDetailResponse
): string {
  const isHost = data.viewer_id === data.host_id;
  const nonHostParticipants = data.participants.filter(
    (participant) => participant.user_id !== data.host_id
  );
  const viewer = data.participants.find(
    (participant) => participant.user_id === data.viewer_id
  );
  const hostName =
    data.participants.find((participant) => participant.user_id === data.host_id)
      ?.users.nickname ?? '방장';
  const receivable = nonHostParticipants.reduce(
    (sum, participant) => sum + participant.amount,
    0
  );

  const heroLabel = isHost
    ? '💰 내가 받을 총 금액'
    : `💸 ${escapeHtml(hostName)}님에게 보낼 금액`;
  const heroAmount = isHost ? receivable : (viewer?.amount ?? 0);
  const heroSub = isHost
    ? `${nonHostParticipants.length}명이 각자 송금할 예정입니다`
    : '방장에게 정산해주세요';

  const tossButton =
    !isHost && data.hostBankName && data.hostAccountNumber
      ? `<a class="${styles.tossButton}" href="${buildTossSendLink(data.hostBankName, data.hostAccountNumber, heroAmount)}">토스로 보내기</a>`
      : '';

  const participantRows = data.participants
    .map((participant) => {
      const isHostRow = participant.user_id === data.host_id;
      const hostTag = isHostRow
        ? `<span class="${styles.tag}">방장</span>`
        : '';

      return `
        <div class="${styles.participantRow}">
          <span class="${styles.checkIcon}">${checkIcon}</span>
          <span class="${styles.participantName}">${escapeHtml(participant.users.nickname)}</span>
          ${hostTag}
          <span class="${styles.participantAmount}">${participant.amount.toLocaleString()}원</span>
        </div>
      `;
    })
    .join('');

  const itemRows = data.items
    .map((item) => {
      const itemTotal = item.amount * item.quantity;
      const perPersonText =
        item.checkedParticipants.length > 0
          ? `1인 ${Math.round(itemTotal / item.checkedParticipants.length).toLocaleString()}원`
          : '';
      const names = item.checkedParticipants
        .map((participant) => escapeHtml(participant.name))
        .join(', ');

      return `
        <div class="${styles.itemRow}">
          <div class="${styles.itemHeader}">
            <span class="${styles.itemName}">${escapeHtml(item.name)}${item.quantity > 1 ? ` <span class="${styles.itemQuantity}">x${item.quantity}</span>` : ''}</span>
            <span class="${styles.itemAmount}">${itemTotal.toLocaleString()}원</span>
          </div>
          <div class="${styles.itemFooter}">
            <span class="${styles.itemNames}">${names}</span>
            <span class="${styles.itemPerPerson}">${perPersonText}</span>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="${styles.page}">
      <header class="${styles.header}">
        <div class="${styles.headerLeft}">
          <button id="back-button" class="${styles.backButton}" type="button" aria-label="뒤로가기">${backIcon}</button>
          <h1 class="${styles.title}">${escapeHtml(data.name)}</h1>
        </div>
        <span class="${styles.settledBadge}">정산 완료</span>
      </header>

      <div class="${styles.stats}">
        <div class="${styles.statItem}">
          <span class="${styles.statLabel}">총 지출</span>
          <span class="${styles.statValue}">${data.totalAmount.toLocaleString()}원</span>
        </div>
        <div class="${styles.statItem}">
          <span class="${styles.statLabel}">참여자</span>
          <span class="${styles.statValue}">${data.participants.length}명</span>
        </div>
        <div class="${styles.statItem}">
          <span class="${styles.statLabel}">항목</span>
          <span class="${styles.statValue}">${data.items.length}개</span>
        </div>
      </div>

      <div class="${styles.content}">
        <div class="${styles.hero}">
          <span class="${styles.heroLabel}">${heroLabel}</span>
          <span class="${styles.heroAmount}">${heroAmount.toLocaleString()}원</span>
          <span class="${styles.heroSub}">${heroSub}</span>
          ${tossButton}
        </div>

        <h2 class="${styles.sectionTitle}">참여자별 금액</h2>
        <div class="${styles.participantList}">
          ${participantRows}
        </div>

        <h2 class="${styles.sectionTitle}">항목 상세</h2>
        <div class="${styles.itemList}">
          ${itemRows}
        </div>
      </div>
    </div>
  `;
}

export function renderRoomSettlementSummary(
  root: HTMLElement,
  data: RoomDetailResponse,
  navigate: (path: string) => void
): void {
  root.innerHTML = renderRoomSettlementSummaryHTML(data);

  const backButton = root.querySelector('#back-button');
  backButton?.addEventListener('click', () => {
    navigate('/rooms');
  });
}
