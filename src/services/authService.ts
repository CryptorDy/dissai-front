import { API_URL } from '../config/api';
import { AUTH_ENDPOINTS, LoginRequest, RegisterRequest, EmailConfirmationRequest, AuthResponse } from '../config/auth';

export interface UserProfile {
  nickname: string;
  email: string;
}

const api = {
  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('auth_token') ? {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        } : {})
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });

    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({ error: 'Ошибка авторизации' }));
      return { Success: false, Error: errorData.error || 'Неверный логин или пароль' };
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network response was not ok' }));
      throw new Error(error.message || 'Network response was not ok');
    }

    return response.json();
  },

  get: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network response was not ok' }));
      throw new Error(error.message || 'Network response was not ok');
    }

    return response.json();
  }
};

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.login, { email, password });
      
      if (response.Success === false) {
        return response;
      }
      
      if (response.Success && response.Token) {
        localStorage.setItem('auth_token', response.Token);
      }
      
      return {
        ...response,
        token: response.Token
      };
    } catch (error: any) {
      return {
        Success: false,
        Error: error.message || 'Ошибка при авторизации'
      };
    }
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.register, data);
      return response;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post(AUTH_ENDPOINTS.logout, {});
    } finally {
      localStorage.removeItem('auth_token');
    }
  },

  confirmEmail: async (data: EmailConfirmationRequest): Promise<AuthResponse> => {
    const response = await api.post(AUTH_ENDPOINTS.confirmEmail, data);
    return response;
  },

  googleAuth: async (accessToken: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/google', { accessToken });
      
      if (response.Token) {
        localStorage.setItem('auth_token', response.Token);
      }
      
      return {
        ...response,
        token: response.Token
      };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await api.get(AUTH_ENDPOINTS.profile);
      return {
        nickname: response.Nickname || '',
        email: response.Email || ''
      };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  setNickname: async (nickname: string, token: string): Promise<void> => {
    try {
      await api.post(AUTH_ENDPOINTS.nickname, { nickname });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }
};