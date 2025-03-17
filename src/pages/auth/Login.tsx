import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

function Login() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      // Отправляем значение identifier как email
      const response = await authService.login(formData.identifier, formData.password);
      
      if (!response.Success) {
        setFormError(response.Error || 'Ошибка авторизации');
        return;
      }

      if (!response.Token) {
        setFormError('Ошибка авторизации: токен не получен');
        return;
      }

      login(response.Token);
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      const errorMessage = error.response?.data?.Error || error.message || 'Ошибка при авторизации';
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const result = await authService.googleAuth(response.access_token);
        if (result.token) {
          login(result.token);
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/auth/setup-nickname');
        }
      } catch (error: any) {
        setFormError('Ошибка при авторизации через Google');
      }
    },
    onError: () => {
      setFormError('Ошибка при авторизации через Google');
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <div className="fixed top-4 right-4">
        <button
          onClick={() => document.documentElement.classList.toggle('dark')}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800 dark:text-gray-200">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
          </svg>
        </button>
      </div>
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Вход в систему
          </h2>

          {formError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email или логин
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  className="w-full pl-10 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Введите email или логин"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5 mr-2" />
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Или войдите через
                </span>
              </div>
            </div>

            <button
              onClick={() => googleLogin()}
              className="mt-4 w-full flex items-center justify-center px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-5 h-5 mr-2"
              />
              Google
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Нет аккаунта?{' '}
            <Link
              to="/auth/register"
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
