import { refreshRoute, type Route } from './router';

const MIN_HIDDEN_MS = 3000;

export function bindRefreshOnVisible(root: HTMLElement, routes: Route[]): void {
  let hiddenAt = 0;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      return;
    }

    const wasHiddenLongEnough = Date.now() - hiddenAt >= MIN_HIDDEN_MS;
    const isEditing = root.querySelector('input, textarea, select') !== null;

    if (wasHiddenLongEnough && !isEditing) {
      refreshRoute(root, window.location.pathname, routes);
    }
  });
}
