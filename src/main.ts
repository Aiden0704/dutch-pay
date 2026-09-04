import './style.css';
import { renderLogin } from './login/ui/login';
import { renderRooms } from './rooms/ui/rooms';
import { renderRoute, type Route } from './shared/router';
import type { MeResponse } from '../shared-types/me';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app 엘리먼트를 찾을 수 없습니다');
}

const route: Route[] = [
  { pattern: '/login', render: renderLogin },
  { pattern: '/rooms', render: renderRooms },
];

try {
  const response = await fetch('/api/me');
  const data = (await response.json()) as MeResponse;

  if (data.loggedIn === true) {
    history.replaceState({}, '', '/rooms');
    renderRoute(app, '/rooms', route);
  } else {
    history.replaceState({}, '', '/login' + window.location.search);
    renderRoute(app, '/login', route);
  }
} catch {
  history.replaceState({}, '', '/login' + window.location.search);
  renderRoute(app, '/login', route);
}
