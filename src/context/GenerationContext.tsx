import React, { createContext, useContext, useState, useCallback } from 'react';
import { GenerationTask, GenerationStatus, GenerationType } from '../types/generation';
import { tasksApi } from '../services/api';

const TASKS_STORAGE_KEY = 'generation_tasks';
const MAX_CONCURRENT_TASKS = 2;

interface GenerationContextType {
  tasks: GenerationTask[];
  startGeneration: (taskId: string, type: GenerationType, title: string) => void;
  cancelTask: (taskId: string) => void;
  fetchTaskResult: (taskId: string) => Promise<any>;
  fetchTasks: () => Promise<void>;
  markTaskRedirected: (taskId: string) => void;
  canAddTask: boolean;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export const useGeneration = () => {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  return context;
};

export const GenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<GenerationTask[]>([]);

  const getActiveTasks = useCallback(() => {
    return tasks.filter(task => 
      task.status === 'pending' && 
      !task.redirected && 
      Date.now() - task.startedAt < 1000 * 60 * 30 // 30 минут
    );
  }, [tasks]);

  const canAddTask = getActiveTasks().length < MAX_CONCURRENT_TASKS;

  const startGeneration = useCallback((taskId: string, type: GenerationType = 'reels', title: string = 'Анализ Reels') => {
    const newTask: GenerationTask = {
      id: taskId,
      type: type,
      title: title,
      status: 'pending',
      progress: 0,
      startedAt: Date.now(),
      canCancel: true,
      redirected: false
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const cancelTask = useCallback(async (taskId: string) => {
    try {
      await tasksApi.cancelTask(taskId);
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? { ...task, status: 'cancelled', canCancel: false }
            : task
        )
      );
    } catch (error) {
      console.error('Error cancelling task:', error);
    }
  }, []);

  const markTaskRedirected = useCallback((taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, redirected: true }
          : task
      )
    );
  }, []);

  const fetchTaskResult = useCallback(async (taskId: string) => {
    try {
      const response = await tasksApi.getTaskResult(taskId);
      const result = response.data;
      
      // Убедимся, что статус корректно преобразован в нижний регистр
      const apiStatus = (result.status || '').toLowerCase();
      
      // Принудительно установим правильный статус на основе данных ответа
      let status: GenerationStatus = 'pending';
      if (apiStatus === 'successful' || apiStatus === 'successfull') {
        status = 'completed';
      } else if (apiStatus === 'cancelled' || apiStatus === 'error' || apiStatus === 'failed') {
        status = 'cancelled';
      }

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? {
                ...task,
                status: status,
                progress: status === 'completed' ? 100 : task.progress,
                result: result.result,
                error: result.error || undefined,
                completedAt: status === 'completed' ? Date.now() : undefined,
                canCancel: status === 'pending'
              }
            : task
        )
      );

      return result.result;
    } catch (error) {
      console.error('Error fetching task result:', error);
      return null;
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await tasksApi.getTasks();
      const mappedTasks = response.data.tasks.map((apiTask: any): GenerationTask => {
        // Определяем статус задачи
        let status: GenerationStatus = 'pending';
        
        if (typeof apiTask.status === 'string') {
          // Убедимся, что статус корректно преобразован в нижний регистр
          const statusLower = apiTask.status.toLowerCase();
          
          // Проверяем на "successful" или "successfull" (с двумя "l")
          if (statusLower === 'successful' || statusLower === 'successfull') {
            status = 'completed';
          } else if (statusLower === 'cancelled' || statusLower === 'error' || statusLower === 'failed') {
            status = 'cancelled';
          }
        }
        
        return {
          id: apiTask.id,
          type: (apiTask.type || 'unknown').toLowerCase(),
          title: apiTask.name || `${apiTask.type || 'Unknown'} Generation`,
          status: status,
          progress: status === 'completed' ? 100 : 0,
          startedAt: apiTask.startTime ? new Date(apiTask.startTime).getTime() : Date.now(),
          completedAt: apiTask.endTime ? new Date(apiTask.endTime).getTime() : undefined,
          canCancel: status === 'pending',
          result: undefined,
          redirected: false,
          name: apiTask.name,
          isViewed: apiTask.isViewed
        };
      });
      
      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, []);

  return (
    <GenerationContext.Provider
      value={{
        tasks,
        startGeneration,
        cancelTask,
        fetchTaskResult,
        fetchTasks,
        markTaskRedirected,
        canAddTask
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
};