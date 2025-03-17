import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Calendar, Clock, ArrowRight, Star, ChevronDown, ChevronUp, FileText, Link, Video, BookOpen } from 'lucide-react';

interface TimelineViewProps {
  markdown: string;
  completedTasks: number[];
}

interface Task {
  content: string;
  description?: string;
  level: number;
  index: number;
  subtasks: Task[];
  parentIndex?: number;
  deadline?: string;
  resources?: string[] | {
    title: string;
    url: string;
    type: string;
  }[];
  completed?: boolean;
}

type TimeStatus = 'overdue' | 'upcoming' | 'far' | 'completed';

interface TimeStatusInfo {
  status: TimeStatus;
  daysLeft: number;
}

function getTimeStatus(deadline: string | undefined, isCompleted: boolean): TimeStatusInfo {
  if (isCompleted) {
    return { status: 'completed', daysLeft: 0 };
  }
  
  if (!deadline) {
    return { status: 'far', daysLeft: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'overdue', daysLeft: Math.abs(diffDays) };
  }
  if (diffDays <= 7) {
    return { status: 'upcoming', daysLeft: diffDays };
  }
  return { status: 'far', daysLeft: diffDays };
}

function getStatusColor(status: TimeStatus) {
  switch (status) {
    case 'overdue':
      return {
        bg: 'bg-red-500',
        text: 'text-red-500',
        light: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-500',
        gradient: 'from-red-500 to-red-600'
      };
    case 'upcoming':
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-500',
        light: 'bg-amber-100 dark:bg-amber-900/30',
        border: 'border-amber-500',
        gradient: 'from-amber-500 to-amber-600'
      };
    case 'completed':
      return {
        bg: 'bg-green-500',
        text: 'text-green-500',
        light: 'bg-green-100 dark:bg-green-900/30',
        border: 'border-green-500',
        gradient: 'from-green-500 to-green-600'
      };
    default:
      return {
        bg: 'bg-blue-500',
        text: 'text-blue-500',
        light: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-500',
        gradient: 'from-blue-500 to-blue-600'
      };
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return dateStr;
  }
}

export function TimelineView({ markdown, completedTasks }: TimelineViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mainTasks, setMainTasks] = useState<Task[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<number[]>([]);

  // Парсинг задач из JSON в markdown
  const parseTasks = (): Task[] => {
    try {
      // Пробуем распарсить как JSON
      const data = JSON.parse(markdown);
      if (data && data.tasks && Array.isArray(data.tasks)) {
        // Преобразуем JSON в плоский список задач
        return flattenTasks(data.tasks);
      }
    } catch (e) {
      console.error("Error parsing JSON in TimelineView:", e);
      // Если не удалось распарсить как JSON, возвращаем пустой массив
      return [];
    }
    
    return [];
  };

  // Функция для преобразования JSON данных в плоский список задач
  const flattenTasks = (tasks: any[]): Task[] => {
    let result: Task[] = [];
    let index = 0;
    
    const processTask = (task: any, level: number = 0, parentIndex?: number): void => {
      const currentIndex = index++;
      
      const parsedTask: Task = {
        content: task.title,
        description: task.description,
        level,
        index: currentIndex,
        subtasks: [],
        parentIndex,
        deadline: task.deadline,
        resources: task.resources,
        completed: task.completed
      };
      
      result.push(parsedTask);
      
      if (task.subtasks && task.subtasks.length > 0) {
        const subtasks: Task[] = [];
        
        task.subtasks.forEach((subtask: any) => {
          const subtaskStartIndex = index;
          processTask(subtask, level + 1, currentIndex);
          
          // Собираем подзадачи для текущей задачи
          const newSubtasks = result.slice(subtaskStartIndex).filter(t => t.parentIndex === currentIndex);
          subtasks.push(...newSubtasks);
        });
        
        parsedTask.subtasks = subtasks;
      }
    };
    
    tasks.forEach(task => processTask(task));
    return result;
  };

  // Инициализация задач
  useEffect(() => {
    const parsedTasks = parseTasks();
    setTasks(parsedTasks);
    
    // Фильтруем только основные задачи (не подзадачи)
    const mainTasksOnly = parsedTasks.filter(task => !task.parentIndex);
    setMainTasks(mainTasksOnly);
    
    // Устанавливаем первую задачу как выбранную по умолчанию
    if (mainTasksOnly.length > 0 && selectedTask === null) {
      setSelectedTask(mainTasksOnly[0].index);
    }
  }, [markdown]);

  // Проверка, выполнена ли задача
  const isTaskCompleted = (task: Task): boolean => {
    // Проверяем сначала по метке в задаче
    if (task.completed) {
      return true;
    }
    
    // Затем проверяем по массиву completedTasks
    if (task.subtasks && task.subtasks.length > 0) {
      return task.subtasks.every(subtask => isTaskCompleted(subtask));
    }
    return completedTasks.includes(task.index);
  };

  // Получаем выбранную задачу
  const getSelectedTaskDetails = () => {
    if (selectedTask === null) return null;
    
    // Ищем задачу по индексу
    const task = tasks.find(t => t.index === selectedTask);
    if (!task) return null;
    
    return task;
  };

  // Получаем подзадачи для выбранной задачи
  const getSubtasksForSelected = () => {
    const task = getSelectedTaskDetails();
    if (!task) return [];
    
    return task.subtasks || [];
  };

  // Прокрутка к выбранной задаче
  const scrollToTask = (taskIndex: number) => {
    const taskElements = document.querySelectorAll('.timeline-task');
    const taskElement = Array.from(taskElements).find(
      el => el.getAttribute('data-task-index') === taskIndex.toString()
    );
    
    if (taskElement && timelineRef.current) {
      const containerWidth = timelineRef.current.offsetWidth;
      const taskLeft = taskElement.getBoundingClientRect().left;
      const containerLeft = timelineRef.current.getBoundingClientRect().left;
      const scrollLeft = taskLeft - containerLeft - containerWidth / 2 + 50;
      
      timelineRef.current.scrollTo({
        left: timelineRef.current.scrollLeft + scrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Переключение отображения подзадач
  const toggleSubtasks = (taskIndex: number) => {
    setExpandedSubtasks(prev => 
      prev.includes(taskIndex) 
        ? prev.filter(i => i !== taskIndex) 
        : [...prev, taskIndex]
    );
  };

  // Функции для работы с ресурсами
  const getResourceIcon = (resource: any) => {
    if (typeof resource === 'string') {
      // Для строковых ресурсов используем общую иконку
      return <FileText className="w-4 h-4 mr-2 text-blue-500" />;
    }
    
    // Для объектных ресурсов выбираем иконку по типу
    switch (resource.type) {
      case 'video':
        return <Video className="w-4 h-4 mr-2 text-red-500" />;
      case 'book':
        return <BookOpen className="w-4 h-4 mr-2 text-purple-500" />;
      case 'article':
        return <FileText className="w-4 h-4 mr-2 text-blue-500" />;
      default:
        return <Link className="w-4 h-4 mr-2 text-gray-500" />;
    }
  };

  const getResourceUrl = (resource: any): string => {
    if (typeof resource === 'string') {
      // Пытаемся извлечь URL из строки в формате markdown [title](url)
      const match = resource.match(/\[.*?\]\((.*?)\)/);
      return match ? match[1] : '#';
    }
    return resource.url || '#';
  };

  const getResourceTitle = (resource: any): string => {
    if (typeof resource === 'string') {
      // Пытаемся извлечь заголовок из строки в формате markdown [title](url)
      const match = resource.match(/\[(.*?)\]/);
      return match ? match[1] : resource;
    }
    return resource.title || 'Ресурс';
  };

  return (
    <div className="p-6">
      {/* Горизонтальный таймлайн */}
      <div 
        ref={timelineRef}
        className="relative overflow-x-auto pb-8 mb-8 hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="relative min-w-max">
          {/* Линия таймлайна */}
          <div className="absolute top-16 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full"></div>
          
          {/* Задачи на таймлайне */}
          <div className="flex items-start pt-4 space-x-16 px-8">
            {mainTasks.map((task, index) => {
              const isCompleted = isTaskCompleted(task);
              const timeStatus = getTimeStatus(task.deadline, isCompleted);
              const colors = getStatusColor(timeStatus.status);
              const isActive = selectedTask === task.index;
              
              return (
                <motion.div
                  key={task.index}
                  className={`timeline-task relative flex flex-col items-center cursor-pointer ${isActive ? 'z-10' : 'z-0'}`}
                  data-task-index={task.index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => {
                    setSelectedTask(task.index);
                    scrollToTask(task.index);
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  {/* Точка на таймлайне */}
                  <div className={`w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center ${isActive ? 'ring-4 ring-blue-300 dark:ring-blue-700' : ''}`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-white" />
                    )}
                  </div>
                  
                  {/* Соединительная линия */}
                  <div className={`w-1 h-8 ${colors.bg}`}></div>
                  
                  {/* Карточка задачи */}
                  <div className={`w-40 p-3 rounded-lg ${colors.light} border ${isActive ? `border-2 ${colors.border}` : 'border-transparent'} transition-all duration-200`}>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {task.content}
                    </h3>
                    
                    {task.deadline && (
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{formatDate(task.deadline)}</span>
                      </div>
                    )}
                    
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {task.subtasks.filter(subtask => isTaskCompleted(subtask)).length}/{task.subtasks.length} подзадач
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            
            {/* Финальная точка */}
            <motion.div
              className="timeline-task relative flex flex-col items-center"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: 0.5,
                duration: 1,
                type: "spring",
                stiffness: 100,
                damping: 10
              }}
            >
              {/* Точка на таймлайне */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              
              {/* Соединительная линия */}
              <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-600"></div>
              
              {/* Карточка цели */}
              <div className="w-40 p-3 rounded-lg shadow-md bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-purple-300 dark:border-purple-800">
                <h3 className="text-sm font-bold text-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                  Цель достигнута
                </h3>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Детали выбранной задачи */}
      <div className="mt-8">
        {selectedTask !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden"
          >
            {/* Детали основной задачи */}
            {(() => {
              const task = getSelectedTaskDetails();
              if (!task) return null;
              
              const isCompleted = isTaskCompleted(task);
              const timeStatus = getTimeStatus(task.deadline, isCompleted);
              const colors = getStatusColor(timeStatus.status);
              
              return (
                <>
                  <div className={`h-2 w-full bg-gradient-to-r ${colors.gradient}`}></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {task.content}
                        </h3>
                        
                        <div className="flex flex-wrap gap-3">
                          <div className={`flex items-center text-sm px-3 py-1 rounded-full ${colors.light} ${colors.text}`}>
                            {isCompleted ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                <span>Выполнено</span>
                              </>
                            ) : timeStatus.status === 'overdue' ? (
                              <>
                                <Clock className="w-4 h-4 mr-1" />
                                <span>Просрочено ({timeStatus.daysLeft} дн.)</span>
                              </>
                            ) : (
                              <>
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>
                                  {task.deadline ? formatDate(task.deadline) : 'Без срока'}
                                  {timeStatus.status === 'upcoming' && ` (осталось ${timeStatus.daysLeft} дн.)`}
                                </span>
                              </>
                            )}
                          </div>
                          
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="flex items-center text-sm px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                              <span>{task.subtasks.filter(subtask => isTaskCompleted(subtask)).length}/{task.subtasks.length} подзадач</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {task.description && (
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300">{task.description}</p>
                      </div>
                    )}

                    {/* Ресурсы основной задачи */}
                    {task.resources && task.resources.length > 0 && (
                      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-blue-500" />
                          Ресурсы
                        </h4>
                        <ul className="space-y-2 pl-6">
                          {task.resources.map((resource, idx) => (
                            <li key={idx} className="text-sm flex items-center">
                              {getResourceIcon(resource)}
                              <a 
                                href={getResourceUrl(resource)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {getResourceTitle(resource)}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
            
            {/* Подзадачи */}
            {(() => {
              const subtasks = getSubtasksForSelected();
              if (subtasks.length === 0) return null;
              
              return (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Подзадачи
                    </h3>
                    
                    <div className="space-y-4">
                      {subtasks.map((subtask, index) => {
                        const isCompleted = isTaskCompleted(subtask);
                        const timeStatus = getTimeStatus(subtask.deadline, isCompleted);
                        const colors = getStatusColor(timeStatus.status);
                        const isExpanded = expandedSubtasks.includes(subtask.index);
                        
                        return (
                          <motion.div
                            key={subtask.index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className={`flex flex-col p-4 rounded-lg ${colors.light} border-l-4 ${colors.border}`}
                          >
                            <div className="flex items-start">
                              <div className={`flex-shrink-0 w-6 h-6 ${colors.bg} rounded-full flex items-center justify-center mr-3`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : (
                                  <Circle className="w-4 h-4 text-white" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <h4 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                                    {subtask.content}
                                  </h4>
                                  
                                  {subtask.resources && subtask.resources.length > 0 && (
                                    <button
                                      onClick={() => toggleSubtasks(subtask.index)}
                                      className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                                
                                {subtask.deadline && (
                                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    <span>
                                      {formatDate(subtask.deadline)}
                                      {timeStatus.status === 'overdue' && !isCompleted && (
                                        <span className="ml-1 text-red-500">(Просрочено)</span>
                                      )}
                                    </span>
                                  </div>
                                )}
                                
                                {subtask.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {subtask.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Ресурсы подзадачи */}
                            {isExpanded && subtask.resources && subtask.resources.length > 0 && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-3 ml-9"
                              >
                                <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  <FileText className="w-4 h-4 mr-1 text-blue-500" />
                                  <span>Ресурсы:</span>
                                </div>
                                <ul className="space-y-1 pl-5 mt-1">
                                  {subtask.resources.map((resource, idx) => (
                                    <li key={idx} className="text-sm flex items-center">
                                      {getResourceIcon(resource)}
                                      <a 
                                        href={getResourceUrl(resource)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        {getResourceTitle(resource)}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </div>
      
      {/* Стрелки навигации */}
      <div className="fixed bottom-8 right-8 flex space-x-4">
        <button
          onClick={() => {
            if (selectedTask === null || mainTasks.length === 0) return;
            
            const currentIndex = mainTasks.findIndex(t => t.index === selectedTask);
            if (currentIndex > 0) {
              const prevTask = mainTasks[currentIndex - 1];
              setSelectedTask(prevTask.index);
              scrollToTask(prevTask.index);
            }
          }}
          className="p-3 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-300 transform rotate-180" />
        </button>
        
        <button
          onClick={() => {
            if (selectedTask === null || mainTasks.length === 0) return;
            
            const currentIndex = mainTasks.findIndex(t => t.index === selectedTask);
            if (currentIndex < mainTasks.length - 1) {
              const nextTask = mainTasks[currentIndex + 1];
              setSelectedTask(nextTask.index);
              scrollToTask(nextTask.index);
            }
          }}
          className="p-3 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
      
      {/* CSS для скрытия полосы прокрутки */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
