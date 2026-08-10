export type UserRole = 'super_admin' | 'admin' | 'director' | 'leader' | 'reader';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  churchId: string | null;
  firstName: string;
  lastName: string;
}

export interface AccessTokenPayload extends AuthUser {
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
