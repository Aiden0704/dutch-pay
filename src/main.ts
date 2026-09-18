import './style.css';
import { renderLogin } from './login/ui/login';
import { renderRooms } from './rooms/ui/rooms';
import { renderRoute, type Route } from './shared/router';
import { renderRoomDetailHost } from './rooms/ui/roomDetailHost';
import type { MeResponse } from '../shared-types/me';

const PATHS = {
  LOGIN: '/login',
  ROOMS: '/rooms',
  ROOMS_DETAIL: '/rooms/:id',
} as const;

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('#app 엘리먼트를 찾을 수 없습니다');
}

const root = app;

const route: Route[] = [
  { pattern: PATHS.LOGIN, render: renderLogin },
  { pattern: PATHS.ROOMS, render: (root) => renderRooms(root, navigate) },
  {
    pattern: PATHS.ROOMS_DETAIL,
    render: (root, params) => renderRoomDetailHost(root, params.id, navigate),
  },
];

function navigate(path: string) {
  history.pushState({}, '', path);
  renderRoute(root, path, route);
}

try {
  const response = await fetch('/api/me');
  const data = (await response.json()) as MeResponse;

  if (data.loggedIn === true) {
    history.replaceState({}, '', PATHS.ROOMS);
    renderRoute(root, PATHS.ROOMS, route);
  } else {
    history.replaceState({}, '', PATHS.LOGIN + window.location.search);
    renderRoute(root, PATHS.LOGIN, route);
  }
} catch {
  history.replaceState({}, '', PATHS.LOGIN + window.location.search);
  renderRoute(root, PATHS.LOGIN, route);
}
