import { escapeHtml } from '../../shared/escapeHtml';
import { isSafeRedirectPath } from '../../shared/isSafeRedirectPath';
import styles from './accountSetup.module.css';

const BANKS = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  '농협은행',
  'IBK기업은행',
  'SC제일은행',
  '카카오뱅크',
  '케이뱅크',
  '토스뱅크',
  '새마을금고',
  '신협',
  '우체국',
  '부산은행',
  '대구은행',
  '경남은행',
  '광주은행',
  '전북은행',
  '제주은행',
  '씨티은행',
];

export function renderAccountSetupHTML(
  currentBankName: string | null,
  currentAccountNumber: string | null
): string {
  const knownBanks =
    currentBankName && !BANKS.includes(currentBankName)
      ? [currentBankName, ...BANKS]
      : BANKS;
  const bankOptions = knownBanks
    .map(
      (bank) =>
        `<option value="${escapeHtml(bank)}" ${bank === currentBankName ? 'selected' : ''}>${escapeHtml(bank)}</option>`
    )
    .join('');

  return `
    <div class="${styles.page}">
      <header class="${styles.header}">
        <h1 class="${styles.title}">계좌 등록</h1>
      </header>

      <div class="${styles.content}">
        <div class="${styles.notice}">
          <p class="${styles.noticeTitle}">💡 왜 필요한가요?</p>
          <p class="${styles.noticeText}">누구나 방장이 될 수 있어요. <br /> 나중에 방장이 됐을 때 참여자들이 정산 금액을 보낼 수 있도록 계좌를 미리 등록해주세요.</p>
        </div>

        <label class="${styles.label}" for="bank-select">은행</label>
        <select class="${styles.select}" id="bank-select">
          <option value="" disabled ${currentBankName ? '' : 'selected'}>은행을 선택해주세요</option>
          ${bankOptions}
        </select>

        <label class="${styles.label}" for="account-input">계좌번호</label>
        <input class="${styles.input}" id="account-input" type="text" inputmode="numeric" placeholder="'-' 없이 숫자만 입력해주세요" value="${escapeHtml(currentAccountNumber ?? '')}" />
        <p class="${styles.error}" id="account-setup-error"></p>
      </div>

      <div class="${styles.footer}">
        <button class="${styles.submitButton}" type="button" id="submit-button">저장</button>
      </div>
    </div>
  `;
}

export async function renderAccountSetup(
  root: HTMLElement,
  navigate: (path: string) => void
): Promise<void> {
  const searchParams = new URLSearchParams(window.location.search);
  const rawRedirect = searchParams.get('redirect');
  const redirect = isSafeRedirectPath(rawRedirect) ? rawRedirect : '/rooms';

  let currentBankName: string | null = null;
  let currentAccountNumber: string | null = null;

  try {
    const response = await fetch('/api/me');
    const data = (await response.json()) as {
      loggedIn: boolean;
      user?: { bank_name: string | null; account_number: string | null };
    };

    if (data.loggedIn && data.user) {
      currentBankName = data.user.bank_name;
      currentAccountNumber = data.user.account_number;
    }
  } catch {
    // 조회 실패 시 빈 값으로 시작
  }

  root.innerHTML = renderAccountSetupHTML(currentBankName, currentAccountNumber);

  const submitButton = root.querySelector<HTMLButtonElement>('#submit-button');
  const errorElement = root.querySelector('#account-setup-error');

  submitButton?.addEventListener('click', async () => {
    const bankSelect = root.querySelector<HTMLSelectElement>('#bank-select');
    const accountInput = root.querySelector<HTMLInputElement>('#account-input');
    const bankName = bankSelect?.value ?? '';
    const accountNumber = accountInput?.value.trim() ?? '';

    if (!bankName || !accountNumber) {
      if (errorElement) {
        errorElement.textContent = '은행과 계좌번호를 모두 입력해주세요';
      }
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = '저장중';

    try {
      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_name: bankName,
          account_number: accountNumber,
        }),
      });

      if (!response.ok) {
        if (errorElement) {
          errorElement.textContent = '저장에 실패하였습니다';
        }
        submitButton.disabled = false;
        submitButton.textContent = '저장';
        return;
      }

      navigate(redirect);
    } catch {
      if (errorElement) {
        errorElement.textContent = '저장에 실패하였습니다';
      }
      submitButton.disabled = false;
      submitButton.textContent = '저장';
    }
  });
}
