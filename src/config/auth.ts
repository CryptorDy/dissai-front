export const AUTH_ENDPOINTS = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  logout: '/api/auth/logout',
  confirmEmail: '/api/auth/confirm-email'
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
