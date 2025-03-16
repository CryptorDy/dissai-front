import React, { useState } from 'react';
import { NavigationMenu } from '../components/NavigationMenu';
import { User, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function Profile() {
  const { profile, refreshProfile } = useAuth();
  const { showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleRefreshProfile = async () => {
    setIsLoading(true);
    try {
      await refreshProfile();
    } catch (error) {
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError('Ошибка при обновлении профиля');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
        <NavigationMenu />
        <div className="flex items-center justify-center h-[calc(100vh-96px)]">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <NavigationMenu />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Профиль
            </h1>
            <button
              onClick={handleRefreshProfile}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Обновление...' : 'Обновить данные'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Никнейм
                </div>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {profile.nickname}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Email
                </div>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {profile.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
