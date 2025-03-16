import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';

function EmailConfirmation() {
  const navigate = useNavigate();

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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Подтвердите ваш email
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            На ваш email отправлено письмо с ссылкой для подтверждения. Пожалуйста, проверьте вашу почту и перейдите по ссылке для завершения регистрации.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/auth/login')}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="mr-2">Перейти к входу</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Не получили письмо? Проверьте папку "Спам" или{' '}
              <button
                onClick={() => navigate('/auth/register')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                попробуйте зарегистрироваться снова
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailConfirmation;
