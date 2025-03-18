import axios from 'axios';
import { TaskListResponse, TaskResultResponse } from '../types/generation';
import { API_URL } from '../config/api';

export interface KnowledgeItem {
  id: string;
  type: 'file' | 'folder';
  name: string;
  content?: string;
  children?: KnowledgeItem[];
  parentId: string | null;
  fileType?: string;
  metadata?: {
    completedTasks?: number[];
    [key: string]: any;
  };
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

export const tasksApi = {
  getTasks: () => api.get<TaskListResponse>('/tasks'),
  getTaskResult: (taskId: string) => api.get<TaskResultResponse>(`/tasks/${taskId}/result`),
  cancelTask: (taskId: string) => api.post(`/tasks/${taskId}/cancel`),
  deleteTask: (taskId: string) => api.delete(`/tasks/${taskId}`),
  getUnviewedTasks: () => api.get<Array<{
    id: string;
    type: string;
    name: string;
    status: string;
    startTime: string;
    endTime: string;
    isCompleted: boolean;
    isViewed: boolean;
  }>>('/tasks/unviewed'),
  markTaskViewed: (taskId: string) => api.post(`/tasks/${taskId}/mark-viewed`),
  markAllTasksViewed: () => api.post('/tasks/mark-all-viewed')
};

export const roadmapApi = {
  generate: (data: { goal: string; deadline: string; detailLevel: number }) => 
    api.post('/roadmap/generate', data)
};

export const knowledgeApi = {
  getItems: () => api.get<KnowledgeItem[]>('/knowledge'),
  getFile: (id: string) => api.get<KnowledgeItem>(`/knowledge/${id}`),
  createFile: (data: KnowledgeItem) => api.post<KnowledgeItem>('/knowledge/file', data),
  createFolder: (name: string, parentId: string | null) => 
    api.post<KnowledgeItem>('/knowledge/folder', { name, parentId }),
  updateItem: (id: string, data: KnowledgeItem) => 
    api.put<KnowledgeItem>(`/knowledge/${id}`, data),
  deleteItem: (id: string, isFolder: boolean) => 
    api.delete(`/knowledge/${id}${isFolder ? '?type=folder' : ''}`),
  moveItem: (id: string, targetFolderId: string | null) => 
    api.post(`/knowledge/${id}/move`, { targetFolderId })
};