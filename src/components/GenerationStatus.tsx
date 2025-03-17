import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, Ban } from 'lucide-react';
import { useGeneration } from '../context/GenerationContext';
import { useLocation, useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'unviewed_completed_tasks';

export function GenerationStatus() {
  const { tasks, cancelTask, fetchTaskResult, markTaskRedirected } = useGeneration();
  const location = useLocation();
  const navigate = useNavigate();

  // Получаем непросмотренные завершенные задачи из localStorage
  const getUnviewedTasks = (): string[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  // Сохраняем непросмотренные задачи в localStorage
  const saveUnviewedTasks = (taskIds: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(taskIds));
  };

  // Добавляем завершенную задачу в список непросмотренных
  useEffect(() => {
    const completedTasks = tasks.filter(task => 
      task.status === 'completed' && 
      !task.redirected
    );
    
    if (completedTasks.length > 0) {
      const unviewedTasks = getUnviewedTasks();
      const newUnviewedTasks = completedTasks
        .filter(task => !unviewedTasks.includes(task.id))
        .map(task => task.id);
      
      if (newUnviewedTasks.length > 0) {
        saveUnviewedTasks([...unviewedTasks, ...newUnviewedTasks]);
      }
    }
  }, [tasks]);

  // Удаляем задачу из непросмотренных при просмотре результата
  const removeFromUnviewed = (taskId: string) => {
    const unviewedTasks = getUnviewedTasks().filter(id => id !== taskId);
    saveUnviewedTasks(unviewedTasks);
    markTaskRedirected(taskId);
  };

  // Очищаем все непросмотренные задачи при посещении страницы задач
  useEffect(() => {
    if (location.pathname === '/tasks') {
      localStorage.removeItem(STORAGE_KEY);
      tasks.forEach(task => {
        if (task.status === 'completed' && !task.redirected) {
          markTaskRedirected(task.id);
        }
      });
    }
  }, [location.pathname, tasks, markTaskRedirected]);

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

  // Получаем задачи для отображения
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const unviewedTaskIds = getUnviewedTasks();
  const completedTasks = tasks
    .filter(task => 
      task.status === 'completed' && 
      !task.redirected &&
      unviewedTaskIds.includes(task.id)
    )
    .sort((a, b) => 
      (b.completedAt || 0) - (a.completedAt || 0)
    );

  // Формируем список задач для отображения (максимум 2)
  const tasksToShow = [...pendingTasks, ...completedTasks].slice(0, 2);

  if (tasksToShow.length === 0) {
    return null;
  }

  const handleViewResult = async (taskId: string, type: string) => {
    const task = tasks.find(t => t.id === taskId);
    removeFromUnviewed(taskId);
    
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
                    {task.title}
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
              ) : (
                <>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </span>
                  <span
                    onClick={() => handleViewResult(task.id, task.type)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Результат
                  </span>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}