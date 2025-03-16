import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { UserMenu } from './UserMenu';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed top-4 right-4 flex items-center space-x-4">
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
        ) : (
          <Sun className="w-5 h-5 text-gray-800 dark:text-gray-200" />
        )}
      </button>
      <UserMenu />
    </div>
  );
}
