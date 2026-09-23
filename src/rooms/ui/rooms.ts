import accountIcon from '../../assets/icons/account.svg?raw';
import type { RoomListItem } from '../../../domain/rooms';
import { escapeHtml } from '../../shared/escapeHtml';
import { renderRoomForm } from './roomForm';
import styles from './rooms.module.css';

export async function renderRooms(
  root: HTMLElement,
  navigate: (path: string) => void
): Promise<void> {
  let roomListItems: RoomListItem[];

  try {
    const roomResponse = await fetch('/api/rooms');

    if (!roomResponse.ok) {
      throw new Error('정산방 목록을 불러오지 못했습니다');
    }

    roomListItems = await roomResponse.json();
  } catch {
    root.innerHTML = '정산방 목록을 불러오지 못했습니다';
    return;
  }

  const totalCount = roomListItems.length;
  const inProgressCount = roomListItems.filter((item) => {
    return item.isCompleted === false;
  }).length;

  const roomCardHtml =
    roomListItems.length === 0
      ? `<p class="${styles.empty}">아직 정산방이 없어요</p>`
      : roomListItems
          .map((item) => {
            return `<div class="${styles.card}" data-room-id="${item.id}">
  <div class="${styles.cardTitleRow}">
    <h3 class="${styles.cardTitle}">${escapeHtml(item.title)}</h3>
    <span class="${styles.roleBadge}">${item.role === 'host' ? '방장' : '참여중'}</span>
    ${item.isCompleted ? `<span class="${styles.doneBadge}">완료</span>` : ''}
  </div>
  <p class="${styles.cardMeta}">인원 ${item.participantCount}명 · 항목 ${item.itemCount}개 · 합계 ${item.totalAmount.toLocaleString()}원</p>
  <p class="${styles.cardDate}">${item.createdAt.slice(0, 10)}</p>
  <div class="${styles.cardAmount}">
    <span class="${styles.amountLabel}">내 금액</span>
    <span class="${styles.amountValue}">${item.myAmount.toLocaleString()}원</span>
  </div>
</div>`;
          })
          .join('');

  root.innerHTML = `
    <div class="${styles.page}">
      <header class="${styles.header}">
        <div class="${styles.headerRow}">
          <h1 class="${styles.title}">내 정산방</h1>
          <button id="account-setup-button" class="${styles.settingsButton}" type="button" aria-label="계좌 정보 수정">${accountIcon}</button>
        </div>
        <p class="${styles.subtitle}">총 ${totalCount}개 · 진행중 ${inProgressCount}개</p>
      </header>

      <div class="${styles.list}">
        ${roomCardHtml}
      </div>

      <div class="${styles.footer}">
        <button id='create-button' class="${styles.createButton}" type="button" >
          + 새 정산방 만들기
        </button>
      </div>
    </div>
  `;

  const createButton = root.querySelector('#create-button');
  createButton?.addEventListener('click', () => {
    renderRoomForm(root, {
      onCancel: () => renderRooms(root, navigate),
      onCreated: (id) => navigate('/rooms/' + id),
    });
  });

  const accountSetupButton = root.querySelector('#account-setup-button');
  accountSetupButton?.addEventListener('click', () => {
    navigate('/account-setup');
  });

  const cards = root.querySelectorAll<HTMLElement>(`.${styles.card}`);
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      navigate(`/rooms/${card.dataset.roomId}`);
    });
  });
}
