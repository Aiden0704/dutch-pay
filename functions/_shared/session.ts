import { jwtVerify, SignJWT } from 'jose';

export interface SessionEnv {
  JWT_SECRET: string;
}

export async function createJwtToken(userId: number, env: SessionEnv) {
  const secretKey = new TextEncoder().encode(env.JWT_SECRET);
  const token = await new SignJWT({ userId: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secretKey);

  return token;
}

export async function verifyJwtToken(jwt: string, env: SessionEnv) {
  const secretKey = new TextEncoder().encode(env.JWT_SECRET);
  const { payload } = await jwtVerify(jwt, secretKey);
  const sessionPayload = payload as { userId: number };
  return sessionPayload.userId;
}
