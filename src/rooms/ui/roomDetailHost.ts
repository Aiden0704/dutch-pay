import backIcon from '../../assets/icons/back.svg?raw';
import checkIcon from '../../assets/icons/check.svg?raw';
import { escapeHtml } from '../../shared/escapeHtml';
import { renderAddItemSheet } from './addItemSheet';
import {
  bindItemChecklist,
  renderItemChecklistHTML,
  type ChecklistItem,
} from './itemChecklist';
import { renderRoomDetail, type RoomDetailResponse } from './roomDetail';
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
  items: ChecklistItem[];
  viewerId: number;
}

export function renderRoomDetailHostHTML({
  roomName,
  hostName,
  totalAmount,
  myTotal,
  participants,
  items,
  viewerId,
}: RenderRoomDetailHostHTMLParams): string {
  const allCompleted =
    participants.length > 1 &&
    participants.every((participant) => participant.isCompleted);

  const participantBadges = participants
    .map((participant) => {
      const completedClass = participant.isCompleted
        ? styles['participantBadge--completed']
        : '';
      const checkMark = participant.isCompleted ? '✓ ' : '';

      return `<span class="${styles.participantBadge} ${completedClass}">${checkMark}${escapeHtml(participant.name)}</span>`;
    })
    .join('');

  const itemListHtml = renderItemChecklistHTML({
    items,
    viewerId,
    canDelete: true,
  });

  return `
    <div class="${styles.page}">
      <header class="${styles.header}">
        <div class="${styles.headerLeft}">
          <button id="back-button" class="${styles.backButton}" type="button" aria-label="뒤로가기">${backIcon}</button>
          <h1 class="${styles.title}">${escapeHtml(roomName)}</h1>
        </div>
        <button id="share-button" class="${styles.shareButton}" type="button">링크 공유</button>
      </header>

      <div class="${styles.summary}">
        <div class="${styles.summaryRow}">
          <span>방장 <strong class="${styles.hostName}">${escapeHtml(hostName)}</strong></span>
          <span class="${styles.summaryTotal}">합계 ${totalAmount.toLocaleString()}원</span>
        </div>
        <div class="${styles.participants}">
          ${participantBadges}
        </div>
      </div>

      <p class="${styles.notice}">⚠️ 1인 금액은 백원 단위로 올림 처리돼요</p>

      ${itemListHtml}

      <div class="${styles.myTotal}">
        <span class="${styles.myTotalLabel}">나의 합계</span>
        <span id="my-total-amount" class="${styles.myTotalAmount}" data-amount="${myTotal}">${myTotal.toLocaleString()}원</span>
      </div>

      <div class="${styles.footer}">
        <button id="add-item-button" class="${styles.addButton}" type="button">+ 항목 추가</button>
        <button id="settle-button" class="${styles.completeButton}" type="button" ${allCompleted ? '' : 'disabled'}>정산 완료</button>
      </div>
    </div>
  `;
}

export function renderRoomDetailHost(
  root: HTMLElement,
  data: RoomDetailResponse,
  id: string,
  navigate: (path: string) => void
): void {
  try {
    const roomName = data.name;
    const hostUser = data.participants.find((participant) => {
      return participant.user_id === data.host_id;
    });

    if (!hostUser) {
      throw new Error('방장이 참여자 목록에 없습니다');
    }

    const hostName = hostUser.users.nickname;
    const totalAmount = data.totalAmount;
    const myTotal = data.myAmount;
    const participants = data.participants.map((participant) => {
      return {
        name: participant.users.nickname,
        isCompleted: participant.isCompleted,
      };
    });
    const items = data.items;
    const viewerId = data.viewer_id;
    const viewer = data.participants.find((participant) => {
      return participant.user_id === viewerId;
    });

    if (!viewer) {
      throw new Error('내가 참여자 목록에 없습니다');
    }

    const viewerName = viewer.users.nickname;

    root.innerHTML = renderRoomDetailHostHTML({
      roomName,
      hostName,
      totalAmount,
      myTotal,
      participants,
      items,
      viewerId,
    });

    const backButton = root.querySelector('#back-button');
    backButton.addEventListener('click', () => {
      navigate('/rooms');
    });

    const shareButton = root.querySelector('#share-button');
    shareButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/rooms/${id}`
        );
        shareButton.classList.add(styles['shareButton--copied']);
        shareButton.innerHTML = `<span class="${styles.shareButtonIcon}">${checkIcon}</span>복사됨`;
      } catch {
        shareButton.textContent = '복사 실패';
      }

      setTimeout(() => {
        shareButton.classList.remove(styles['shareButton--copied']);
        shareButton.textContent = '링크 공유';
      }, 1500);
    });

    const addItemButton = root.querySelector('#add-item-button');
    addItemButton.addEventListener('click', () => {
      renderAddItemSheet(root, id, {
        onCancel: () => {},
        onAdded: () => renderRoomDetail(root, id, navigate),
      });
    });

    const settleButton =
      root.querySelector<HTMLButtonElement>('#settle-button');
    settleButton?.addEventListener('click', async () => {
      settleButton.disabled = true;

      try {
        const response = await fetch(`/api/rooms/${id}/settle`, {
          method: 'POST',
        });

        if (!response.ok) {
          settleButton.disabled = false;
          return;
        }

        renderRoomDetail(root, id, navigate);
      } catch {
        settleButton.disabled = false;
      }
    });

    bindItemChecklist(root, {
      roomId: id,
      viewerId,
      viewerName,
      onChange: () => renderRoomDetail(root, id, navigate),
      onMyAmountDelta: (delta) => {
        const myTotalElement = root.querySelector<HTMLElement>(
          '#my-total-amount'
        );

        if (!myTotalElement) {
          return;
        }

        const nextAmount =
          Number(myTotalElement.dataset.amount ?? 0) + delta;

        myTotalElement.dataset.amount = String(nextAmount);
        myTotalElement.textContent = `${nextAmount.toLocaleString()}원`;
      },
    });
  } catch {
    root.innerHTML = '정산방 상세 화면 불러오기에 실패하였습니다';
  }

  return;
}
