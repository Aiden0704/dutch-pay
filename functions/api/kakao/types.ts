import type { SessionEnv } from '../../_shared/session';
import type { SupabaseEnv } from '../../_shared/supabase';

export interface Env extends SupabaseEnv, SessionEnv {
  KAKAO_REST_API_KEY: string;
  KAKAO_CLIENT_SECRET: string;
  KAKAO_REDIRECT_URI: string;
}

export interface KakaoUser {
  id: number;
  properties?: { nickname?: string };
}
