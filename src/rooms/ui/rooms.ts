import styles from './rooms.module.css';

export function renderRooms(root: HTMLElement) {
  root.innerHTML = `
    <div class="${styles.page}">
      <header class="${styles.header}">
        <h1 class="${styles.title}">내 정산방</h1>
        <p class="${styles.subtitle}">총 0개 · 진행중 0개</p>
      </header>

      <div class="${styles.list}"></div>

      <div class="${styles.footer}">
        <button class="${styles.createButton}" type="button">
          + 새 정산방 만들기
        </button>
      </div>
    </div>
  `;
}
