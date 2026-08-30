interface RedirectWithCookieOptions {
  location: string;
  cookieName: string;
  cookieValue: string;
  maxAge?: number;
}

export function redirectWithCookie(options: RedirectWithCookieOptions) {
  const { location, cookieName, cookieValue, maxAge } = options;
  const maxAgePart = maxAge ? `; Max-Age=${maxAge}` : '';

  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': `${cookieName}=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Path=/${maxAgePart}`,
      Location: `${location}`,
    },
  });
}
