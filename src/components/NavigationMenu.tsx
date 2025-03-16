import React from 'react';
import { ArrowLeft, Home, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

interface NavigationMenuProps {
  onBack?: () => void;
}

export function NavigationMenu({ onBack }: NavigationMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Проверяем, находимся ли мы на странице авторизации или базы знаний
  const isAuthPage = location.pathname.startsWith('/auth/');
  const isKnowledgePage = location.pathname === '/knowledge';

  return (
    <div className="flex items-center justify-between p-8">
      <div className="flex items-center space-x-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад
          </button>
        )}
        {!isAuthPage && (
          <>
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Home className="w-5 h-5 mr-2" />
              Главная
            </button>
            {!isKnowledgePage && (
              <button
                onClick={() => navigate('/knowledge')}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                База знаний
              </button>
            )}
          </>
        )}
      </div>
      <ThemeToggle />
    </div>
  );
}
