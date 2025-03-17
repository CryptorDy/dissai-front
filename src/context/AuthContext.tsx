import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, UserProfile } from '../services/authService';
import { useToast } from './ToastContext';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  profile: UserProfile | null;
  login: (token: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { showError } = useToast();
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (newToken: string) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setToken(null);
      setProfile(null);
      localStorage.removeItem('auth_token');
    }
  };

  const loadProfile = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    try {
      const data = await authService.getProfile();
      const safeProfile: UserProfile = {
        nickname: data.nickname || '',
        email: data.email || ''
      };
      setProfile(safeProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError('Ошибка при загрузке профиля');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    setProfile(null);
    await loadProfile();
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token]);

  const contextValue: AuthContextType = {
    isAuthenticated: !!token,
    isLoading,
    token,
    profile,
    login,
    logout,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

