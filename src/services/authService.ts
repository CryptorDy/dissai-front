import { API_URL } from '../config/api';
import { AUTH_ENDPOINTS, LoginRequest, RegisterRequest, EmailConfirmationRequest, AuthResponse } from '../config/auth';
import { api } from './api';

export interface UserProfile {
  nickname: string;
  email: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.login, { email, password });
      const data = response.data;
      
      if (data.Success && data.Token) {
        localStorage.setItem('auth_token', data.Token);
      }
      
      return {
        ...data,
        token: data.Token
      };
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post(AUTH_ENDPOINTS.register, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post(AUTH_ENDPOINTS.logout);
    } finally {
      localStorage.removeItem('auth_token');
    }
  },

  confirmEmail: async (data: EmailConfirmationRequest): Promise<AuthResponse> => {
    const response = await api.post(AUTH_ENDPOINTS.confirmEmail, data);
    return response.data;
  },

  googleAuth: async (accessToken: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/api/auth/google', { accessToken });
      const data = response.data;
      
      if (data.Token) {
        localStorage.setItem('auth_token', data.Token);
      }
      
      return {
        ...data,
        token: data.Token
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
      const response = await api.get('/api/Account/profile');
      return {
        nickname: response.data.Nickname || '',
        email: response.data.Email || ''
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
      await api.post('/api/Account/nickname', { nickname });
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }
};
