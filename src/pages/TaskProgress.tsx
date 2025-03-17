import React, { useEffect } from 'react';
import { NavigationMenu } from '../components/NavigationMenu';
import { useGeneration } from '../context/GenerationContext';
import { Clock, Ban, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function TaskProgress() {
  const { tasks, cancelTask, fetchTasks } = useGeneration();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleViewResult = (taskId: string, type: string) => {
    navigate('/task/result', { state: { taskId, type } });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTaskDuration = (startTime: number, endTime?: number) => {
    const end = endTime || Date.now();
    const durationMs = end - startTime;
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) {
      return `${seconds} сек`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes} мин ${remainingSeconds} сек`;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершено';
      case 'error':
        return 'Ошибка';
      case 'cancelled':
        return 'Отменено';
      default:
        return 'В процессе';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'cancelled':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <NavigationMenu />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Задачи</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">Управление задачами генерации контента</p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Список задач</h2>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">У вас пока нет задач</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(task.status)}`}>
                            {getStatusText(task.status)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>Начало: {formatTime(task.startedAt)}</span>
                          {task.completedAt && (
                            <span>Завершено: {formatTime(task.completedAt)}</span>
                          )}
                          <span>Длительность: {getTaskDuration(task.startedAt, task.completedAt)}</span>
                        </div>
                        {task.error && (
                          <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                            Ошибка: {task.error}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        {task.status === 'pending' && task.canCancel && (
                          <button
                            onClick={() => cancelTask(task.id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            title="Отменить задачу"
                          >
                            <Ban className="w-5 h-5" />
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <button
                            onClick={() => handleViewResult(task.id, task.type)}
                            className="group flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:shadow-md"
                          >
                            <span>Результат</span>
                            <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                          </button>
                        )}
                        {task.status === 'pending' && (
                          <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
                        )}
                      </div>
                    </div>
                    {task.status === 'pending' && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <motion.div
                            className="bg-blue-500 h-2 rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${task.progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskProgress;