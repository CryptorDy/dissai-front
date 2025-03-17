import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, LogOut, ChevronDown, UserCircle, ListTodo } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useGeneration } from '../context/GenerationContext';

export function UserMenu() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const { isAuthenticated, profile, logout } = useAuth();
  const { tasks } = useGeneration();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const pendingTasks = tasks.filter(task => task.status === 'pending').length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError('Ошибка при выходе');
      }
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Получаем позицию кнопки для правильного позиционирования меню
  const getMenuPosition = () => {
    if (!buttonRef.current) return { top: 0, right: 0 };
    
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY,
      right: window.innerWidth - rect.right - window.scrollX
    };
  };

  const menuPosition = getMenuPosition();

  return (
    <div className="relative flex items-center gap-4">
      <button
        onClick={() => navigate('/tasks')}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Задачи"
      >
        <ListTodo className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {pendingTasks > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs flex items-center justify-center rounded-full">
            {pendingTasks}
          </span>
        )}
      </button>

      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        {profile && (
          <>
            <span className="text-gray-700 dark:text-gray-300">{profile.nickname}</span>
            <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className="fixed z-[9999]"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-48 bg-white dark:bg-gray-800 rounded-lg py-2 mt-2"
          >
            {profile && (
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {profile.nickname}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {profile.email}
                </div>
              </div>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/profile');
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <UserCircle className="w-4 h-4 mr-2" />
              Кабинет
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </button>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
