import backIcon from '../../../assets/icons/back.svg?raw';
import type { MeResponse } from '../../../../shared-types/me';
import { escapeHtml } from '../../../shared/escapeHtml';
import styles from './roomForm.module.css';

interface CreateRoomResponse {
  id: string;
}

export function renderRoomFormHTML(hostName: string): string {
  return `
    <div class="${styles.page}">
      <header class="${styles.header}">
        <button id="back-button" class="${styles.backButton}" type="button" aria-label="뒤로가기">${backIcon}</button>
        <h1 class="${styles.title}">새 정산방 만들기</h1>
      </header>

      <div class="${styles.content}">
        <div class="${styles.notice}">
          <p class="${styles.noticeTitle}">💡 방장 안내</p>
          <p class="${styles.noticeText}">최종 결제하신 분이 방을 만들어주세요. <br /> 참여자는 각자 먹은 항목을 체크하면 방장에게 송금할 금액이 자동으로 계산됩니다.</p>
        </div>

        <label class="${styles.label}" for="room-name">모임 이름</label>
        <input class="${styles.input}" id="room-name" type="text" placeholder="예: 강남 회식, 제주도 여행" />
        <p class="${styles.error}" id="room-form-error"></p>

        <label class="${styles.label}" for="room-host">방장</label>
        <input class="${styles.input}" id="room-host" type="text" value="${escapeHtml(hostName)}" disabled />
      </div>

      <div class="${styles.footer}">
        <button class="${styles.cancelButton}" type="button" id="cancel-button">취소</button>
        <button class="${styles.submitButton}" type="button" id="submit-button">만들기</button>
      </div>
    </div>
  `;
}

export async function renderRoomForm(
  root: HTMLElement,
  options: { onCancel: () => void; onCreated: (id: string) => void }
): Promise<void> {
  let nickname: string;

  try {
    const response = await fetch('/api/me');
    const data = (await response.json()) as MeResponse;

    if (data.loggedIn) {
      nickname = data.user.nickname ?? '닉네임이 없습니다';

      root.innerHTML = renderRoomFormHTML(nickname);
    } else {
      throw new Error('로그인 된 사용자가 아닙니다');
    }
  } catch {
    root.innerHTML = '방 만들기에 실패하였습니다';
    return;
  }

  const cancelButton = root.querySelector('#cancel-button');
  cancelButton?.addEventListener('click', () => {
    options.onCancel();
  });

  const backButton = root.querySelector('#back-button');
  backButton?.addEventListener('click', () => {
    options.onCancel();
  });

  const submitButton = root.querySelector(
    '#submit-button'
  ) as HTMLButtonElement;
  submitButton.addEventListener('click', async () => {
    const inputName = root.querySelector('#room-name') as HTMLInputElement;
    const roomName = inputName.value.trim();
    const errorElement = root.querySelector('#room-form-error');

    if (!roomName) {
      if (errorElement) {
        errorElement.textContent = '모임 이름을 입력해주세요';
      }
      return;
    }

    try {
      submitButton.classList.add(styles['submitButton-loading']);
      submitButton.disabled = true;
      submitButton.textContent = '생성중';

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName }),
      });

      if (!response.ok) {
        if (errorElement) {
          errorElement.textContent = '방 생성에 실패하였습니다';
        }
        submitButton.classList.remove(styles['submitButton-loading']);
        submitButton.disabled = false;
        submitButton.textContent = '만들기';

        return;
      }

      const data = (await response.json()) as CreateRoomResponse;
      options.onCreated(data.id);
    } catch {
      if (errorElement) {
        errorElement.textContent = '방 생성에 실패하였습니다';
      }
      submitButton.classList.remove(styles['submitButton-loading']);
      submitButton.disabled = false;
      submitButton.textContent = '만들기';

      return;
    }
  });
}
