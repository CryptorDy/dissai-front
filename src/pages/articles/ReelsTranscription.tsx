import React, { useState } from 'react';
import { NavigationMenu } from '../../components/NavigationMenu';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import { useGeneration } from '../../context/GenerationContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Instagram, Link } from 'lucide-react';
import { API_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

type TabType = 'accounts' | 'single';

function ReelsTranscription() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { startGeneration, canAddTask } = useGeneration();
  const { showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('accounts');
  
  const [usernames, setUsernames] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [minViews, setMinViews] = useState<number>(1000);
  const [periodNumber, setPeriodNumber] = useState<number>(1);
  const [periodUnit, setPeriodUnit] = useState<'days' | 'weeks'>('weeks');
  
  const [reelsUrl, setReelsUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMinViewsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const number = parseInt(value);
    if (!isNaN(number) && number >= 0) {
      setMinViews(number);
    } else if (value === '') {
      setMinViews(0);
    }
  };

  const handlePeriodNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const number = parseInt(value);
    if (!isNaN(number) && number >= 1 && number <= 52) {
      setPeriodNumber(number);
    } else if (value === '') {
      setPeriodNumber(1);
    }
  };

  const handleSubmitAccounts = async () => {
    if (!token) {
      showError('Необходима авторизация');
      navigate('/auth/login');
      return;
    }

    if (usernames.length === 0) return;

    if (!canAddTask) {
      showError('Достигнут лимит параллельных задач. Дождитесь завершения текущих задач.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/reels/analyze-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          instagramAccounts: usernames,
          minimumViews: minViews,
          period: {
            number: periodNumber,
            unit: periodUnit
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.taskId) {
        throw new Error('Не получен ID задачи');
      }

      startGeneration(data.taskId, 'reels', 'Анализ аккаунтов Reels');
      navigate('/dashboard');

    } catch (error) {
      console.error('Error analyzing accounts:', error);
      showError(error instanceof Error ? error.message : 'Произошла ошибка при анализе Reels');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitSingleReels = async () => {
    if (!token) {
      showError('Необходима авторизация');
      navigate('/auth/login');
      return;
    }

    if (!reelsUrl.trim()) return;

    if (!reelsUrl.includes('instagram.com/reel/') && !reelsUrl.includes('instagram.com/p/')) {
      showError('Пожалуйста, введите корректную ссылку на Instagram Reels');
      return;
    }

    if (!canAddTask) {
      showError('Достигнут лимит параллельных задач. Дождитесь завершения текущих задач.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/reels/analyze-single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url: reelsUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.taskId) {
        throw new Error('Не получен ID задачи');
      }

      startGeneration(data.taskId, 'reels', 'Анализ Reels');
      navigate('/dashboard');

    } catch (error) {
      console.error('Error analyzing single reel:', error);
      showError(error instanceof Error ? error.message : 'Произошла ошибка при анализе Reels');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingAnimation withNavigation />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <NavigationMenu />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Анализ Reels</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">Выберите формат анализа</p>
        </header>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="flex mb-8 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('accounts')}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'accounts'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Instagram className="w-4 h-4 mr-2" />
                  Аккаунты
                </div>
              </button>
              <button
                onClick={() => setActiveTab('single')}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'single'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Link className="w-4 h-4 mr-2" />
                  Конкретный Reels
                </div>
              </button>
            </div>
            
            {activeTab === 'accounts' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instagram аккаунты (до 10)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {usernames.map((username) => (
                      <span
                        key={username}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm flex items-center"
                      >
                        @{username}
                        <button
                          onClick={() => setUsernames(usernames.filter(u => u !== username))}
                          className="ml-2 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && inputValue.trim()) {
                          e.preventDefault();
                          if (inputValue.trim() && !usernames.includes(inputValue.trim()) && usernames.length < 10) {
                            setUsernames([...usernames, inputValue.trim()]);
                            setInputValue('');
                          }
                        }
                      }}
                      placeholder="Добавьте аккаунт..."
                      className="flex-1 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => {
                        if (inputValue.trim() && !usernames.includes(inputValue.trim()) && usernames.length < 10) {
                          setUsernames([...usernames, inputValue.trim()]);
                          setInputValue('');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Добавить
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {10 - usernames.length} аккаунтов осталось
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Минимальное количество просмотров
                  </label>
                  <input
                    type="number"
                    value={minViews}
                    onChange={handleMinViewsChange}
                    min="0"
                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    За последние
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      value={periodNumber}
                      onChange={handlePeriodNumberChange}
                      min="1"
                      max="52"
                      className="w-24 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                    <select
                      value={periodUnit}
                      onChange={(e) => setPeriodUnit(e.target.value as 'days' | 'weeks')}
                      className="flex-1 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="days">дней</option>
                      <option value="weeks">недель</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSubmitAccounts}
                  disabled={usernames.length === 0 || isLoading || !canAddTask}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {!canAddTask ? 'Достигнут лимит задач' : (isLoading ? 'Анализ...' : 'Начать анализ')}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ссылка на Instagram Reels
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reelsUrl}
                      onChange={(e) => setReelsUrl(e.target.value)}
                      placeholder="https://www.instagram.com/reel/..."
                      className="flex-1 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Вставьте полную ссылку на Reels, который хотите проанализировать
                  </div>
                </div>

                <button
                  onClick={handleSubmitSingleReels}
                  disabled={!reelsUrl.trim() || isLoading || !canAddTask}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {!canAddTask ? 'Достигнут лимит задач' : (isLoading ? 'Анализ...' : 'Анализировать Reels')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReelsTranscription;