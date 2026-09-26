export interface Route {
  pattern: string;
  render: (root: HTMLElement, params: Record<string, string>) => void;
  refreshOnVisible?: boolean;
}

export function renderRoute(
  root: HTMLElement,
  pathName: string,
  routes: Route[]
): boolean {
  for (const route of routes) {
    const params = matchRoute(pathName, route.pattern);

    if (params !== null) {
      route.render(root, params);
      return true;
    }
  }

  return false;
}

export function refreshRoute(
  root: HTMLElement,
  pathName: string,
  routes: Route[]
): boolean {
  return renderRoute(
    root,
    pathName,
    routes.filter((route) => route.refreshOnVisible)
  );
}

export function matchRoute(
  pathName: string,
  pattern: string
): Record<string, string> | null {
  const pathParts = pathName.split('/');
  const patternParts = pattern.split('/');
  const params: Record<string, string> = {};

  if (pathParts.length !== patternParts.length) {
    return null;
  }

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    } else {
      if (patternPart !== pathPart) {
        return null;
      }
    }
  }
  return params;
}
