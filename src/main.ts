import './style.css';
import { renderLogin } from './login/ui/login';
import { renderRooms } from './rooms/ui/rooms';
import type { MeResponse } from '../shared-types/me';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app 엘리먼트를 찾을 수 없습니다');
}

try {
  const response = await fetch('/api/me');
  const data = (await response.json()) as MeResponse;

  if (data.loggedIn === true) {
    renderRooms(app);
  } else {
    renderLogin(app);
  }
} catch {
  renderLogin(app);
}
