import styles from './addItemSheet.module.css';

interface AddItemSheetOptions {
  onCancel: () => void;
  onAdded: () => void;
}

function renderRowHTML(index: number): string {
  return `
    <div class="${styles.row}" data-row>
      <span class="${styles.rowLabel}">항목 ${index}</span>
      <div class="${styles.rowInputs}">
        <input class="${styles.nameInput}" type="text" placeholder="항목명 (예: 삼겹살)" data-name-input />
        <input class="${styles.quantityInput}" type="number" min="1" value="1" data-quantity-input />
        <div class="${styles.amountWrap}">
          <input class="${styles.amountInput}" type="number" min="0" placeholder="단가" data-amount-input />
          <span>원</span>
        </div>
      </div>
    </div>
  `;
}

function renderAddItemSheetHTML(): string {
  return `
    <div class="${styles.overlay}" id="add-item-overlay">
      <div class="${styles.sheet}">
        <div class="${styles.header}">
          <h2 class="${styles.title}">항목 추가</h2>
          <button class="${styles.closeButton}" type="button" id="close-button" aria-label="닫기">×</button>
        </div>

        <div class="${styles.rows}" id="item-rows">
          ${renderRowHTML(1)}
        </div>

        <button class="${styles.addRowButton}" type="button" id="add-row-button">+ 항목 하나 더</button>
        <p class="${styles.error}" id="item-form-error"></p>

        <div class="${styles.footer}">
          <button class="${styles.cancelButton}" type="button" id="cancel-button">취소</button>
          <button class="${styles.submitButton}" type="button" id="submit-button">추가하기 (0개)</button>
        </div>
      </div>
    </div>
  `;
}

function getRowValue(row: Element) {
  const nameInput = row.querySelector<HTMLInputElement>('[data-name-input]');
  const quantityInput = row.querySelector<HTMLInputElement>(
    '[data-quantity-input]'
  );
  const amountInput = row.querySelector<HTMLInputElement>(
    '[data-amount-input]'
  );

  return {
    name: nameInput?.value.trim() ?? '',
    quantity: Number(quantityInput?.value ?? 0),
    amount: Number(amountInput?.value ?? 0),
  };
}

function isRowValid(row: Element): boolean {
  const value = getRowValue(row);
  return value.name !== '' && value.quantity >= 1 && value.amount >= 1;
}

export function renderAddItemSheet(
  root: HTMLElement,
  roomId: string,
  options: AddItemSheetOptions
): void {
  root.insertAdjacentHTML('beforeend', renderAddItemSheetHTML());

  const overlay = root.querySelector('#add-item-overlay') as HTMLElement;
  const rowsContainer = overlay.querySelector('#item-rows') as HTMLElement;
  const submitButton = overlay.querySelector(
    '#submit-button'
  ) as HTMLButtonElement;
  const errorElement = overlay.querySelector(
    '#item-form-error'
  ) as HTMLElement;

  function close() {
    overlay.remove();
  }

  function updateSubmitButton() {
    const rows = rowsContainer.querySelectorAll('[data-row]');
    const validCount = Array.from(rows).filter(isRowValid).length;
    submitButton.textContent = `추가하기 (${validCount}개)`;
  }

  overlay.querySelector('#close-button')?.addEventListener('click', () => {
    close();
    options.onCancel();
  });

  overlay.querySelector('#cancel-button')?.addEventListener('click', () => {
    close();
    options.onCancel();
  });

  overlay.querySelector('#add-row-button')?.addEventListener('click', () => {
    const nextIndex = rowsContainer.querySelectorAll('[data-row]').length + 1;
    rowsContainer.insertAdjacentHTML('beforeend', renderRowHTML(nextIndex));
    updateSubmitButton();
  });

  rowsContainer.addEventListener('input', updateSubmitButton);

  submitButton.addEventListener('click', async () => {
    const rows = Array.from(rowsContainer.querySelectorAll('[data-row]'));

    if (!rows.every(isRowValid)) {
      errorElement.textContent = '모든 항목의 이름, 개수, 단가를 입력해주세요';
      return;
    }

    const items = rows.map(getRowValue);

    try {
      submitButton.disabled = true;
      submitButton.textContent = '추가 중';

      const response = await fetch(`/api/rooms/${roomId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { reason?: string };
        throw new Error(data.reason ?? '항목 추가에 실패하였습니다');
      }

      close();
      options.onAdded();
    } catch (error) {
      errorElement.textContent =
        error instanceof Error ? error.message : '항목 추가에 실패하였습니다';
      submitButton.disabled = false;
      updateSubmitButton();
    }
  });
}
