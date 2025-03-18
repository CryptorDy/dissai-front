import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Ban, X, Check } from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { GenerationTask } from '../types/generation';
import type { GenerationStatus } from '../types/generation';
import { tasksApi } from '../services/api';

export function GenerationStatus() {
  const { cancelTask, fetchTaskResult } = useGeneration();
  const location = useLocation();
  const navigate = useNavigate();
  const [unviewedTasks, setUnviewedTasks] = useState<GenerationTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Преобразуем ответ API в формат GenerationTask
  const mapApiTaskToGenerationTask = (apiTask: any): GenerationTask => {
    // Определяем статус задачи по умолчанию
    let status: GenerationStatus = 'pending';
    
    // Проверяем поле Status (строковое значение)
    if (typeof apiTask.Status === 'string') {
      const statusValue = apiTask.Status.toString();
      
      switch (statusValue) {
        case 'InProgress':
          status = 'pending';
          break;
        case 'Successfull':
          status = 'completed';
          break;
        case 'Cancelled':
          status = 'cancelled';
          break;
        case 'Error':
          status = 'cancelled';
          break;
      }
    } 
    // Запасной вариант - проверка IsCompleted
    else if (apiTask.IsCompleted === true || apiTask.isCompleted === true) {
      status = 'completed';
    }
    // Запасной вариант - проверка числового статуса
    else if (apiTask.Status === 1) {
      status = 'completed';
    }
    // Запасной вариант - проверка текстового статуса с поддержкой регистронезависимости
    else if (typeof apiTask.status === 'string') {
      const statusLower = apiTask.status.toLowerCase();
      
      if (statusLower === 'successful' || statusLower === 'successfull') {
        status = 'completed';
      } else if (statusLower === 'cancelled' || statusLower === 'error' || statusLower === 'failed') {
        status = 'cancelled';
      }
    }
    
    return {
      id: apiTask.id || apiTask.Id,
      type: ((apiTask.type || apiTask.GenerationType || 'unknown').toString()).toLowerCase(),
      title: apiTask.name || apiTask.TaskName || `${apiTask.type || apiTask.GenerationType || 'Unknown'} Generation`,
      status: status,
      progress: status === 'completed' ? 100 : 0,
      startedAt: apiTask.startTime || apiTask.StartTime ? new Date(apiTask.startTime || apiTask.StartTime).getTime() : Date.now(),
      completedAt: apiTask.endTime || apiTask.EndTime ? new Date(apiTask.endTime || apiTask.EndTime).getTime() : undefined,
      canCancel: status === 'pending',
      redirected: false,
      name: apiTask.name || apiTask.TaskName,
      isViewed: apiTask.isViewed || apiTask.IsViewed,
      result: apiTask.Result ? JSON.parse(apiTask.Result) : undefined
    };
  };

  // Загрузка непросмотренных задач
  const fetchUnviewedTasks = async () => {
    try {
      setIsLoading(true);
      const response = await tasksApi.getUnviewedTasks();
      // Преобразуем данные из API в формат GenerationTask
      const tasks = response.data.map(mapApiTaskToGenerationTask);
      setUnviewedTasks(tasks);
    } catch (error) {
      console.error('Ошибка при получении непросмотренных задач:', error);
      setUnviewedTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Метод для пометки задачи как просмотренной
  const markTaskAsViewed = async (taskId: string) => {
    try {
      await tasksApi.markTaskViewed(taskId);
      console.log(`Задача ${taskId} помечена как просмотренная`);
      // Обновляем список непросмотренных задач после пометки
      setUnviewedTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Ошибка при пометке задачи как просмотренной:', error);
    }
  };

  // Загружаем непросмотренные задачи при монтировании компонента
  // и обновляем их регулярно, если мы не на странице задач
  useEffect(() => {
    // Не загружаем задачи, если мы на странице задач
    if (location.pathname === '/tasks') {
      return;
    }

    // Загружаем непросмотренные задачи сразу
    fetchUnviewedTasks();

    // Настраиваем периодическое обновление
    const intervalId = setInterval(() => {
      fetchUnviewedTasks();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [location.pathname]);

  const getResultUrl = (type: string) => {
    switch (type.toLowerCase()) {
      case 'roadmap': return '/roadmap/result';
      case 'reels': return '/articles/reels/result';
      case 'article': return '/articles/regular';
      case 'simplify': return '/articles/simplify';
      case 'educational': return '/articles/educational';
      case 'notes': return '/articles/notes';
      case 'content-plan': return '/articles/content-plan';
      default: return '/';
    }
  };

  // Показываем статус только если не на странице задач
  if (location.pathname === '/tasks') return null;

  // Если загружаем данные и еще нет задач, не показываем компонент
  if (isLoading && unviewedTasks.length === 0) return null;

  // Сортируем задачи: сначала в процессе, затем завершенные
  const tasksToShow = [...unviewedTasks]
    .sort((a, b) => {
      // Сначала показываем задачи в процессе
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      
      // Затем по времени завершения (от новых к старым)
      if (a.status === 'completed' && b.status === 'completed') {
        return (b.completedAt || 0) - (a.completedAt || 0);
      }
      
      return 0;
    })
    // Ограничиваем максимум двумя задачами
    .slice(0, 2);

  // Не отображаем, если нет задач для показа
  if (tasksToShow.length === 0) {
    return null;
  }

  const handleViewResult = async (taskId: string, type: string) => {
    // Помечаем задачу как просмотренную
    await markTaskAsViewed(taskId);
    
    const task = unviewedTasks.find(t => t.id === taskId);
    if (task?.result) {
      navigate(getResultUrl(type), { state: task.result });
    } else {
      const result = await fetchTaskResult(taskId);
      if (result) {
        navigate(getResultUrl(type), { state: result });
      }
    }
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <motion.div
        key="generation-status-container"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl px-6 py-3"
      >
        <div className="flex flex-col space-y-2">
          {tasksToShow.map((task) => (
            <motion.div
              key={`task-${task.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center space-x-3"
            >
              {task.status === 'pending' ? (
                <>
                  <div className="relative">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-500/30"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.5, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {task.name || task.title}
                  </span>
                  {task.canCancel && (
                    <button
                      onClick={() => cancelTask(task.id)}
                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full"
                      title="Отменить задачу"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : task.status === 'cancelled' ? (
                <>
                  <div className="relative">
                    <Ban className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {task.name || task.title}
                  </span>
                  <button
                    onClick={() => markTaskAsViewed(task.id)}
                    className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    title="Закрыть"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {task.name || task.title}
                  </span>
                  <span
                    onClick={() => handleViewResult(task.id, task.type)}
                    className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer"
                  >
                    Результат
                  </span>
                  <button
                    onClick={() => markTaskAsViewed(task.id)}
                    className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    title="Закрыть"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}