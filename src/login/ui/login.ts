import styles from './login.module.css';
import kakaoLoginImg from '../../assets/image/kakao_login_large_wide.png';

const infoRows = [
  { icon: '💳', text: '결제한 분이 정산방을 만들고 링크를 공유해요' },
  { icon: '✅', text: '참여자는 링크로 입장 후 자신이 먹은 항목을 체크해요' },
  { icon: '🧧', text: '방장이 완료하면 각자 송금해야 할 금액이 확정돼요' },
];

export function renderLogin(root: HTMLElement) {
  root.innerHTML = `
    <div class="${styles.page}">
      <div class="${styles.hero}">
        <div class="${styles.icon}">👉🏻</div>
        <h1 class="${styles.title}">내꺼내</h1>
        <p class="${styles.subtitle}">
          각자의 것, 각자 내는 더치페이<br />
          링크 하나로 간편하게
        </p>
      </div>

      <div class="${styles.card}">
        ${infoRows
          .map(
            (row) => `
              <div class="${styles.row}">
                <span>${row.icon}</span>
                <span>${row.text}</span>
              </div>
            `
          )
          .join('')}
      </div>

      <button class="${styles.kakaoButton}" type="button">
          <img src="${kakaoLoginImg}" alt="카카오 로그인">
      </button>

      <p class="${styles.terms}">로그인하면 이용약관에 동의하는 것으로 간주합니다</p>
    </div>
  `;
}
