import type { User } from '../functions/_shared/users';

export type MeResponse =
  | { loggedIn: true; user: User }
  | { loggedIn: false; reason: string };
