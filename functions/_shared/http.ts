interface RedirectWithCookieOptions {
  location: string;
  cookieName: string;
  cookieValue: string;
  maxAge?: number;
  extraCookie?: { name: string; value: string; maxAge?: number };
}

function buildCookie(name: string, value: string, maxAge?: number): string {
  const maxAgePart = maxAge !== undefined ? `; Max-Age=${maxAge}` : '';
  return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/${maxAgePart}`;
}

export function redirectWithCookie(options: RedirectWithCookieOptions) {
  const { location, cookieName, cookieValue, maxAge, extraCookie } = options;

  const headers = new Headers();
  headers.append('Location', location);
  headers.append('Set-Cookie', buildCookie(cookieName, cookieValue, maxAge));

  if (extraCookie) {
    headers.append(
      'Set-Cookie',
      buildCookie(extraCookie.name, extraCookie.value, extraCookie.maxAge)
    );
  }

  return new Response(null, { status: 302, headers });
}

const SAFE_REDIRECT_PATTERN = /^\/(?!\/)[A-Za-z0-9/_\-.?=&%]*$/;

export function isSafeRedirectPath(
  path: string | null | undefined
): path is string {
  return !!path && SAFE_REDIRECT_PATTERN.test(path);
}

export function getCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const matchedCookie = cookieHeader
    .split('; ')
    .find((cookie) => cookie.startsWith(name + '='));

  if (!matchedCookie) {
    return;
  }
  const cookieValue = matchedCookie.slice(name.length + 1);

  return cookieValue;
}
