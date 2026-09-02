interface RedirectWithCookieOptions {
  location: string;
  cookieName: string;
  cookieValue: string;
  maxAge?: number;
}

export function redirectWithCookie(options: RedirectWithCookieOptions) {
  const { location, cookieName, cookieValue, maxAge } = options;
  const maxAgePart = maxAge !== undefined ? `; Max-Age=${maxAge}` : '';

  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': `${cookieName}=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Path=/${maxAgePart}`,
      Location: location,
    },
  });
}

export function getCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const matchedCookie = cookieHeader
    .split('; ')
    .find((cookie) => cookie.startsWith(name + '='));

  if (!matchedCookie) {
    return;
  }

  const index = matchedCookie.indexOf('=');
  const cookieValue = matchedCookie.slice(index + 1);

  return cookieValue;
}
