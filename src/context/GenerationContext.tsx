import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { GenerationTask, GenerationStatus } from '../types/generation';
import { tasksApi } from '../services/api';

const TASKS_STORAGE_KEY = 'generation_tasks';
const MAX_CONCURRENT_TASKS = 2;

interface GenerationContextType {
  tasks: GenerationTask[];
  startGeneration: (taskId: string) => void;
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
  const [tasks, setTasks] = useState<GenerationTask[]>(() => {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    return storedTasks ? JSON.parse(storedTasks) : [];
  });

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const getActiveTasks = useCallback(() => {
    return tasks.filter(task => 
      task.status === 'pending' && 
      !task.redirected && 
      Date.now() - task.startedAt < 1000 * 60 * 30 // 30 минут
    );
  }, [tasks]);

  const canAddTask = getActiveTasks().length < MAX_CONCURRENT_TASKS;

  const startGeneration = useCallback((taskId: string) => {
    const newTask: GenerationTask = {
      id: taskId,
      type: 'reels',
      title: 'Анализ Reels',
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

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? {
                ...task,
                status: result.status.toLowerCase() as GenerationStatus,
                progress: result.status === 'Completed' ? 100 : task.progress,
                result: result.result,
                error: result.error,
                completedAt: result.status === 'Completed' ? Date.now() : undefined,
                canCancel: false
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
      const mappedTasks = response.data.tasks.map((apiTask: any): GenerationTask => ({
        id: apiTask.id,
        type: apiTask.type.toLowerCase(),
        title: `${apiTask.type} Generation`,
        status: apiTask.status.toLowerCase() as GenerationStatus,
        progress: apiTask.isCompleted ? 100 : 0,
        startedAt: new Date(apiTask.startTime).getTime(),
        completedAt: apiTask.endTime ? new Date(apiTask.endTime).getTime() : undefined,
        canCancel: !apiTask.isCompleted,
        result: undefined,
        redirected: false
      }));
      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, []);

  // Автоматическое обновление статуса задач
  useEffect(() => {
    const pendingTasks = tasks.filter(task => task.status === 'pending');
    
    if (pendingTasks.length > 0) {
      const intervalId = setInterval(() => {
        pendingTasks.forEach(task => {
          fetchTaskResult(task.id);
        });
      }, 5000);
      
      return () => clearInterval(intervalId);
    }
  }, [tasks, fetchTaskResult]);

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