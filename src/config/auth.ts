export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  confirmEmail: '/auth/confirm-email',
  profile: '/account/profile',
  nickname: '/account/nickname'
};

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface EmailConfirmationRequest {
  token: string;
}

export interface AuthResponse {
  Success?: boolean;
  Token?: string;
  message?: string;
  token?: string;
}