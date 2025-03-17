import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Trash2, 
  Plus,
  AlertCircle,
  FileText,
  Link,
  Video,
  BookOpen,
  FileQuestion
} from 'lucide-react';

interface Task {
  title: string;
  deadline?: string;
  description?: string;
  completed?: boolean;
  subtasks?: Task[];
  resources?: string[] | {
    title: string;
    url: string;
    type: string;
  }[];
}

interface RoadmapData {
  goal: string;
  tasks: Task[];
}

interface ModernTaskListProps {
  jsonData: RoadmapData | null;
  onTaskToggle: (index: number) => void;
  completedTasks: number[];
  onMarkdownChange?: (newMarkdown: string) => void;
  editable?: boolean;
  markdown?: string; // Оставляем для обратной совместимости, но не используем
}

interface ParsedTask {
  content: string;
  description?: string;
  level: number;
  index: number;
  subtasks: ParsedTask[];
  parentIndex?: number;
  deadline?: string;
  resources?: string[] | {
    title: string;
    url: string;
    type: string;
  }[];
  completed?: boolean;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4"
      >
        <div className="flex items-center mb-4 text-red-500">
          <AlertCircle className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Удалить
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface EditTaskDialogProps {
  isOpen: boolean;
  task: {
    index: number;
    content: string;
    description?: string;
    deadline?: string;
    resources?: string[] | {
      title: string;
      url: string;
      type: string;
    }[];
  };
  onSave: (index: number, content: string, description: string, deadline: string, resources: any[]) => void;
  onCancel: () => void;
}

function EditTaskDialog({ isOpen, task, onSave, onCancel }: EditTaskDialogProps) {
  const [content, setContent] = useState(task.content);
  const [description, setDescription] = useState(task.description || '');
  const [deadline, setDeadline] = useState(task.deadline || '');
  const [resources, setResources] = useState<any[]>(task.resources || []);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState('article');

  if (!isOpen) return null;

  const addResource = () => {
    if (newResourceTitle.trim()) {
      if (newResourceUrl.trim()) {
        // Добавляем ресурс в новом формате
        setResources([...resources, {
          title: newResourceTitle.trim(),
          url: newResourceUrl.trim(),
          type: newResourceType
        }]);
      } else {
        // Добавляем ресурс в старом формате (просто строка)
        setResources([...resources, newResourceTitle.trim()]);
      }
      setNewResourceTitle('');
      setNewResourceUrl('');
    }
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const getResourceTitle = (resource: any): string => {
    if (typeof resource === 'string') {
      return resource;
    }
    return resource.title || 'Ресурс';
  };

  const getResourceUrl = (resource: any): string => {
    if (typeof resource === 'string') {
      // Пытаемся извлечь URL из строки в формате markdown [title](url)
      const match = resource.match(/\[.*?\]\((.*?)\)/);
      return match ? match[1] : '#';
    }
    return resource.url || '#';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Редактирование задачи
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Название задачи
            </label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Описание (до 500 символов)
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setDescription(e.target.value);
                }
              }}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
              {description.length}/500
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Дедлайн
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ресурсы
            </label>
            <div className="space-y-2 mb-2">
              {resources.map((resource, index) => (
                <div key={index} className="flex items-center">
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                    {getResourceTitle(resource)}
                  </span>
                  <button
                    onClick={() => removeResource(index)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={newResourceTitle}
                onChange={(e) => setNewResourceTitle(e.target.value)}
                placeholder="Название ресурса..."
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newResourceUrl}
                  onChange={(e) => setNewResourceUrl(e.target.value)}
                  placeholder="URL ресурса (опционально)..."
                  className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                />
                <select
                  value={newResourceType}
                  onChange={(e) => setNewResourceType(e.target.value)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                >
                  <option value="article">Статья</option>
                  <option value="video">Видео</option>
                  <option value="book">Книга</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              <button
                onClick={addResource}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Отмена
          </button>
          <button
            onClick={() => onSave(task.index, content, description, deadline, resources)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Сохранить
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ModernTaskList({ 
  jsonData, 
  onTaskToggle, 
  completedTasks, 
  onMarkdownChange, 
  editable = true 
}: ModernTaskListProps) {
  const [editingTask, setEditingTask] = useState<{ index: number; content: string; description?: string; deadline?: string; resources?: any[] } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<number[]>([]);
  const [tasks, setTasks] = useState<ParsedTask[]>([]);
  const [flattenedTasks, setFlattenedTasks] = useState<ParsedTask[]>([]);

  // Функция для преобразования JSON данных в плоский список задач
  const flattenTasks = (tasks: Task[]): ParsedTask[] => {
    let result: ParsedTask[] = [];
    let index = 0;
    
    const processTask = (task: Task, level: number = 0, parentIndex?: number): void => {
      const currentIndex = index++;
      
      const parsedTask: ParsedTask = {
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
        const subtasks: ParsedTask[] = [];
        
        task.subtasks.forEach(subtask => {
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

  // Инициализация задач и определение, какие задачи нужно раскрыть по умолчанию
  useEffect(() => {
    if (jsonData) {
      // Если есть JSON данные, используем их
      const flatTasks = flattenTasks(jsonData.tasks);
      setTasks(flatTasks.filter(task => !task.parentIndex)); // Только основные задачи
      setFlattenedTasks(flatTasks); // Все задачи в плоском виде
    } else {
      setTasks([]);
      setFlattenedTasks([]);
    }
    
    // Находим только основные задачи, у которых есть подзадачи или ресурсы
    const mainTasksWithContent = tasks
      .filter(task => 
        (task.subtasks && task.subtasks.length > 0) || 
        (task.resources && task.resources.length > 0)
      )
      .map(task => task.index);
    
    setExpandedTasks(mainTasksWithContent);
  }, [jsonData]);

  // Проверка, выполнена ли задача
  const isTaskCompleted = (task: ParsedTask): boolean => {
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

  // Обработчик переключения состояния задачи
  const handleTaskToggle = (index: number) => {
    // Вызываем внешний обработчик
    onTaskToggle(index);
    
    // Обновляем JSON
    if (jsonData && onMarkdownChange) {
      // Если у нас есть JSON данные, обновляем их
      const updatedData = JSON.parse(JSON.stringify(jsonData));
      
      // Функция для рекурсивного поиска и обновления задачи по индексу
      const updateTaskStatus = (tasks: Task[], currentIndex: number = 0): { tasks: Task[], newIndex: number } => {
        const updatedTasks = [...tasks];
        let newIndex = currentIndex;
        
        for (let i = 0; i < updatedTasks.length; i++) {
          if (newIndex === index) {
            // Нашли нужную задачу, меняем статус
            updatedTasks[i].completed = !updatedTasks[i].completed;
            newIndex++;
            break;
          }
          
          newIndex++;
          
          // Рекурсивно обрабатываем подзадачи
          if (updatedTasks[i].subtasks && updatedTasks[i].subtasks.length > 0) {
            const result = updateTaskStatus(updatedTasks[i].subtasks, newIndex);
            updatedTasks[i].subtasks = result.tasks;
            newIndex = result.newIndex;
          }
        }
        
        return { tasks: updatedTasks, newIndex };
      };
      
      // Обновляем статус задачи
      const result = updateTaskStatus(updatedData.tasks);
      updatedData.tasks = result.tasks;
      
      // Преобразуем обновленные данные в JSON и вызываем функцию обновления
      const updatedJson = JSON.stringify(updatedData, null, 2);
      onMarkdownChange(updatedJson);
    }
  };

  const toggleTaskExpand = (index: number) => {
    setExpandedTasks(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  const handleEdit = (task: ParsedTask) => {
    setEditingTask({
      index: task.index,
      content: task.content,
      description: task.description,
      deadline: task.deadline,
      resources: task.resources
    });
  };

  const handleDelete = (task: ParsedTask) => {
    setTaskToDelete(task.index);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (taskToDelete === null) return;

    if (jsonData && onMarkdownChange) {
      // Если у нас есть JSON данные, обновляем их
      const updatedData = JSON.parse(JSON.stringify(jsonData));
      
      // Функция для рекурсивного поиска и удаления задачи
      const deleteTask = (tasks: Task[], currentIndex: number = 0): { tasks: Task[], newIndex: number, deleted: boolean } => {
        let updatedTasks = [...tasks];
        let newIndex = currentIndex;
        let deleted = false;
        
        for (let i = 0; i < updatedTasks.length; i++) {
          if (newIndex === taskToDelete) {
            // Нашли нужную задачу, удаляем её
            updatedTasks.splice(i, 1);
            deleted = true;
            break;
          }
          
          newIndex++;
          
          // Рекурсивно обрабатываем подзадачи
          if (updatedTasks[i].subtasks && updatedTasks[i].subtasks.length > 0) {
            const result = deleteTask(updatedTasks[i].subtasks, newIndex);
            updatedTasks[i].subtasks = result.tasks;
            newIndex = result.newIndex;
            
            if (result.deleted) {
              deleted = true;
              break;
            }
          }
        }
        
        return { tasks: updatedTasks, newIndex, deleted };
      };
      
      // Удаляем задачу
      const result = deleteTask(updatedData.tasks);
      updatedData.tasks = result.tasks;
      
      // Преобразуем обновленные данные в JSON и вызываем функцию обновления
      const updatedJson = JSON.stringify(updatedData, null, 2);
      onMarkdownChange(updatedJson);
    }
    
    setShowConfirmDialog(false);
    setTaskToDelete(null);
  };

  const handleSaveEdit = async (index: number, content: string, description: string, deadline: string, resources: any[]) => {
    if (!content.trim() || !editingTask) return;
    
    if (jsonData && onMarkdownChange) {
      // Если у нас есть JSON данные, обновляем их
      const updatedData = JSON.parse(JSON.stringify(jsonData));
      
      // Функция для рекурсивного поиска и обновления задачи
      const updateTask = (tasks: Task[], currentIndex: number = 0): { tasks: Task[], newIndex: number, updated: boolean } => {
        const updatedTasks = [...tasks];
        let newIndex = currentIndex;
        let updated = false;
        
        for (let i = 0; i < updatedTasks.length; i++) {
          if (newIndex === index) {
            // Нашли нужную задачу, обновляем её
            updatedTasks[i].title = content;
            updatedTasks[i].description = description || undefined;
            updatedTasks[i].deadline = deadline || undefined;
            updatedTasks[i].resources = resources.length > 0 ? resources : undefined;
            updated = true;
            break;
          }
          
          newIndex++;
          
          // Рекурсивно обрабатываем подзадачи
          if (updatedTasks[i].subtasks && updatedTasks[i].subtasks.length > 0) {
            const result = updateTask(updatedTasks[i].subtasks, newIndex);
            updatedTasks[i].subtasks = result.tasks;
            newIndex = result.newIndex;
            
            if (result.updated) {
              updated = true;
              break;
            }
          }
        }
        
        return { tasks: updatedTasks, newIndex, updated };
      };
      
      // Обновляем задачу
      const result = updateTask(updatedData.tasks);
      updatedData.tasks = result.tasks;
      
      // Преобразуем обновленные данные в JSON и вызываем функцию обновления
      const updatedJson = JSON.stringify(updatedData, null, 2);
      onMarkdownChange(updatedJson);
    }
    
    setEditingTask(null);
  };

  const addTask = (parentIndex?: number) => {
    if (jsonData && onMarkdownChange) {
      // Если у нас есть JSON данные, обновляем их
      const updatedData = JSON.parse(JSON.stringify(jsonData));
      
      // Создаем новую задачу
      const newTask: Task = {
        title: 'Новая задача',
        description: '',
        completed: false
      };
      
      if (parentIndex === undefined) {
        // Добавляем задачу в корень
        updatedData.tasks.push(newTask);
      } else {
        // Функция для рекурсивного поиска родительской задачи
        const addTaskToParent = (tasks: Task[], currentIndex: number = 0): { tasks: Task[], newIndex: number, added: boolean } => {
          const updatedTasks = [...tasks];
          let newIndex = currentIndex;
          let added = false;
          
          for (let i = 0; i < updatedTasks.length; i++) {
            if (newIndex === parentIndex) {
              // Нашли родительскую задачу, добавляем подзадачу
              if (!updatedTasks[i].subtasks) {
                updatedTasks[i].subtasks = [];
              }
              updatedTasks[i].subtasks.push(newTask);
              added = true;
              break;
            }
            
            newIndex++;
            
            // Рекурсивно обрабатываем подзадачи
            if (updatedTasks[i].subtasks && updatedTasks[i].subtasks.length > 0) {
              const result = addTaskToParent(updatedTasks[i].subtasks, newIndex);
              updatedTasks[i].subtasks = result.tasks;
              newIndex = result.newIndex;
              
              if (result.added) {
                added = true;
                break;
              }
            }
          }
          
          return { tasks: updatedTasks, newIndex, added };
        };
        
        // Добавляем задачу к родителю
        const result = addTaskToParent(updatedData.tasks);
        updatedData.tasks = result.tasks;
      }
      
      // Преобразуем обновленные данные в JSON и вызываем функцию обновления
      const updatedJson = JSON.stringify(updatedData, null, 2);
      onMarkdownChange(updatedJson);
    }
  };

  // Проверяем, есть ли у задачи подзадачи или ресурсы
  const hasExpandableContent = (task: ParsedTask): boolean => {
    return (task.subtasks && task.subtasks.length > 0) || (task.resources && task.resources.length > 0);
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
    <div className="space-y-6 bg-white dark:bg-gray-800 rounded-xl p-8">
      {editable && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => addTask()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить задачу
          </button>
        </div>
      )}
      
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={`task-${task.index}`} className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <div 
              className={`
                ${isTaskCompleted(task) 
                  ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' 
                  : task.deadline && new Date(task.deadline) < new Date() 
                    ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                }
              `}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => handleTaskToggle(task.index)}
                      className="mt-1 focus:outline-none hover:scale-110 transition-transform"
                    >
                      {isTaskCompleted(task) ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {task.content}
                      </h3>
                      
                      {task.description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-3 mt-3">
                        {task.deadline && (
                          <div className={`flex items-center text-sm px-3 py-1 rounded-full ${
                            new Date(task.deadline) < new Date() && !isTaskCompleted(task)
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}>
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(task.deadline).toLocaleDateString()}
                            {new Date(task.deadline) < new Date() && !isTaskCompleted(task) && (
                              <span className="ml-1">(Просрочено)</span>
                            )}
                          </div>
                        )}
                        
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="flex items-center text-sm px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            <span>{task.subtasks.length} подзадач{task.subtasks.length > 1 ? '' : 'а'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {editable && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(task)}
                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(task)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      {hasExpandableContent(task) && (
                        <button
                          onClick={() => toggleTaskExpand(task.index)}
                          className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full ml-2"
                        >
                          {expandedTasks.includes(task.index) ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <AnimatePresence>
                {expandedTasks.includes(task.index) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Ресурсы основной задачи */}
                    {task.resources && task.resources.length > 0 && (
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
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
                    
                    {/* Подзадачи */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Подзадачи
                        </h4>
                        <div className="space-y-2 pl-6">
                          {task.subtasks.map((subtask) => (
                            <div 
                              key={`subtask-${subtask.index}`}
                              className={`p-3 rounded-lg ${
                                isTaskCompleted(subtask)
                                  ? 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500'
                                  : subtask.deadline && new Date(subtask.deadline) < new Date()
                                    ? 'bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500'
                                    : 'bg-white dark:bg-gray-700 border-l-2 border-blue-500'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => handleTaskToggle(subtask.index)}
                                  className="mt-1 focus:outline-none hover:scale-110 transition-transform"
                                >
                                  {isTaskCompleted(subtask) ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                  )}
                                </button>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <h5 className="text-base font-medium text-gray-900 dark:text-white">
                                      {subtask.content}
                                    </h5>
                                    {editable && (
                                      <div className="flex space-x-1">
                                        <button
                                          onClick={() => handleEdit(subtask)}
                                          className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(subtask)}
                                          className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {subtask.description && (
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                      {subtask.description}
                                    </p>
                                  )}
                                  
                                  {subtask.deadline && (
                                    <div className="mt-2 flex items-center text-sm">
                                      <Clock className="w-3 h-3 mr-1 text-gray-500 dark:text-gray-400" />
                                      <span className={`${
                                        new Date(subtask.deadline) < new Date() && !isTaskCompleted(subtask)
                                          ? 'text-red-500'
                                          : 'text-gray-500 dark:text-gray-400'
                                      }`}>
                                        {new Date(subtask.deadline).toLocaleDateString()}
                                        {new Date(subtask.deadline) < new Date() && !isTaskCompleted(subtask) && (
                                          <span className="ml-1">(Просрочено)</span>
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Ресурсы подзадачи */}
                                  {subtask.resources && subtask.resources.length > 0 && (
                                    <div className="mt-3">
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
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {editable && (
                          <div className="mt-3 pl-6">
                            <button
                              onClick={() => addTask(task.index)}
                              className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Добавить подзадачу
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
      
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDialog(false)}
        title="Подтверждение удаления"
        message="Вы уверены, что хотите удалить эту задачу?"
      />
      
      {editingTask && (
        <EditTaskDialog
          isOpen={true}
          task={editingTask}
          onSave={handleSaveEdit}
          onCancel={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
