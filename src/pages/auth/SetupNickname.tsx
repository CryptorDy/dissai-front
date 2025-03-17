import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

function SetupNickname() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [nickname, setNickname] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      showError('Ошибка авторизации');
      navigate('/auth/login');
      return;
    }

    setIsLoading(true);

    try {
      await authService.setNickname(nickname, token);
      navigate('/dashboard');
    } catch (error: any) {
      showError(error.response?.data?.message || 'Ошибка при установке никнейма');
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Завершите регистрацию
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Выберите никнейм
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full pl-10 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Ваш никнейм"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !nickname.trim()}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Сохранение...' : 'Продолжить'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SetupNickname;
