import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function Register() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push('Пароль должен содержать минимум 6 символов');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Пароль должен содержать хотя бы одну цифру');
    }

    return errors;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Валидация email
    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }

    // Валидация пароля
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      newErrors.password = passwordErrors.join('\n');
    }

    // Проверка совпадения паролей
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      const response = await authService.register({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      // Проверяем наличие ошибки
      if (!response.Success) {
        if (response.Error?.toLowerCase().includes('already taken')) {
          setErrors(prev => ({
            ...prev,
            email: 'Этот email уже зарегистрирован'
          }));
        } else {
          setFormError(response.Error || 'Ошибка при регистрации');
        }
        return;
      }

      // Если нет ошибки, считаем регистрацию успешной
      navigate('/auth/email-confirmation');
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.Error || 'Ошибка при регистрации';
      if (errorMessage.toLowerCase().includes('already taken')) {
        setErrors(prev => ({
          ...prev,
          email: 'Этот email уже зарегистрирован'
        }));
      } else {
        setFormError(errorMessage);
      }
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
            Регистрация
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
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={`w-full pl-10 p-3 rounded-lg border ${
                    errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white`}
                  placeholder="your@email.com"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
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
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  className={`w-full pl-10 p-3 rounded-lg border ${
                    errors.password ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white`}
                  placeholder="••••••••"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Пароль должен содержать минимум 6 символов и хотя бы одну цифру
              </p>
              {errors.password && errors.password.split('\n').map((error, index) => (
                <p key={index} className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {error}
                </p>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Подтверждение пароля
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  className={`w-full pl-10 p-3 rounded-lg border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                  } bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Уже есть аккаунт?{' '}
            <Link
              to="/auth/login"
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
