import React, { useState } from 'react';
import { NavigationMenu } from '../components/NavigationMenu';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { useGeneration } from '../context/GenerationContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Target, ArrowRight, Calendar, Sliders } from 'lucide-react';
import { roadmapApi } from '../services/api';

function Roadmap() {
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [detailLevel, setDetailLevel] = useState(5);
  const { startGeneration, canAddTask } = useGeneration();
  const { showError } = useToast();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      showError('Необходима авторизация');
      navigate('/auth/login');
      return;
    }

    if (!goal.trim()) {
      showError('Пожалуйста, укажите вашу цель');
      return;
    }

    if (!deadline) {
      showError('Пожалуйста, укажите дедлайн');
      return;
    }

    if (!canAddTask) {
      showError('Достигнут лимит параллельных задач. Дождитесь завершения текущих задач.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await roadmapApi.generate({
        goal,
        deadline,
        detailLevel
      });

      const data = response.data;
      
      if (!data.taskId) {
        throw new Error('Не получен ID задачи');
      }

      startGeneration(data.taskId, 'roadmap', 'Дорожная карта (Roadmap)');
      
      // Если данные готовы сразу (в случае тестирования), передаем их напрямую
      if (data.result) {
        navigate('/roadmap-result', { 
          state: { 
            content: JSON.stringify(data.result),
            detailLevel 
          } 
        });
      } else {
        navigate('/roadmap-result');
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
      showError(error instanceof Error ? error.message : 'Произошла ошибка при создании роадмапа');
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Дорожная карта (Roadmap)</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">Укажите вашу цель и получите детальный план действий</p>
        </header>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Создание дорожной карты</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Ваша цель
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                  rows={4}
                  placeholder="Опишите, чего вы хотите достичь..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Дедлайн
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Sliders className="w-4 h-4 mr-2" />
                  Уровень детализации
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={detailLevel}
                  onChange={(e) => setDetailLevel(Number(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Базовый</span>
                  <span>Средний</span>
                  <span>Детальный</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Уровень {detailLevel}: {detailLevel <= 3 ? 'минимум деталей, только ключевые этапы' : 
                  detailLevel <= 7 ? 'оптимальный уровень детализации' : 'максимально подробный план'}
                </p>
              </div>
              
              <button
                type="submit"
                className="w-full flex items-center justify-center py-4 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                <span>Создать дорожную карту</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Roadmap;
