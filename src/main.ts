import './style.css';
import { renderAccountSetup } from './account/ui/accountSetup';
import { renderLogin } from './login/ui/login';
import { renderRooms } from './rooms/ui/list/rooms';
import { renderRoute, type Route } from './shared/router';
import { renderRoomDetail } from './rooms/ui/detail/roomDetail';
import type { MeResponse } from '../shared-types/me';

const PATHS = {
  LOGIN: '/login',
  ROOMS: '/rooms',
  ROOMS_DETAIL: '/rooms/:id',
  ACCOUNT_SETUP: '/account-setup',
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
    render: (root, params) => renderRoomDetail(root, params.id, navigate),
  },
  {
    pattern: PATHS.ACCOUNT_SETUP,
    render: (root) => renderAccountSetup(root, navigate),
  },
];

function navigate(path: string) {
  history.pushState({}, '', path);
  renderRoute(root, path, route);
}

window.addEventListener('popstate', () => {
  renderRoute(root, window.location.pathname, route);
});

function goToLogin() {
  const currentPath = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  if (currentPath !== PATHS.LOGIN) {
    searchParams.set('redirect', currentPath);
  }

  const query = searchParams.toString();
  history.replaceState({}, '', query ? `${PATHS.LOGIN}?${query}` : PATHS.LOGIN);
  renderRoute(root, PATHS.LOGIN, route);
}

try {
  const response = await fetch('/api/me');
  const data = (await response.json()) as MeResponse;

  if (data.loggedIn === true) {
    const currentPath = window.location.pathname;
    const targetPath = currentPath === PATHS.LOGIN ? PATHS.ROOMS : currentPath;
    const needsAccountSetup = !data.user.bank_name || !data.user.account_number;

    if (needsAccountSetup && targetPath !== PATHS.ACCOUNT_SETUP) {
      const accountSetupPath = `${PATHS.ACCOUNT_SETUP}?redirect=${encodeURIComponent(targetPath)}`;

      history.replaceState({}, '', accountSetupPath);
      renderRoute(root, PATHS.ACCOUNT_SETUP, route);
    } else {
      history.replaceState({}, '', targetPath);
      const matched = renderRoute(root, targetPath, route);

      if (!matched) {
        history.replaceState({}, '', PATHS.ROOMS);
        renderRoute(root, PATHS.ROOMS, route);
      }
    }
  } else {
    goToLogin();
  }
} catch {
  goToLogin();
}
