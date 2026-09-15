export function renderRoomFormHTML(hostName: string): string {
  return `
    <div class="${styles.page}">
      <header class="${styles.header}">
        <button id="back-button" class="${styles.backButton}" type="button" aria-label="뒤로가기">‹</button>
        <h1 class="${styles.title}">새 정산방 만들기</h1>
      </header>

      <div class="${styles.content}">
        <div class="${styles.notice}">
          <p class="${styles.noticeTitle}">💡 방장 안내</p>
          <p class="${styles.noticeText}">최종 결제하신 분이 방을 만들어주세요. 참여자들이 각자 먹은 항목을 체크하면 방장에게 송금할 금액이 자동으로 계산됩니다.</p>
        </div>

        <label class="${styles.label}" for="room-name">모임 이름</label>
        <input class="${styles.input}" id="room-name" type="text" placeholder="예: 강남 회식, 제주도 여행" />

        <label class="${styles.label}" for="room-host">방장</label>
        <input class="${styles.input} ${styles.readonlyInput}" id="room-host" type="text" value="${escapeHtml(hostName)}" readonly />

        <p class="${styles.error}" id="room-form-error"></p>
      </div>

      <div class="${styles.footer}">
        <button class="${styles.cancelButton}" type="button" id="cancel-button">취소</button>
        <button class="${styles.submitButton}" type="button" id="submit-button">만들기</button>
      </div>
    </div>
  `;
}

