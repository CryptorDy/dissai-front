import axios from 'axios';
import { TaskListResponse, TaskResultResponse } from '../types/generation';

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
  baseURL: '/',
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
  getTasks: () => api.get<TaskListResponse>('/api/tasks'),
  getTaskResult: (taskId: string) => api.get<TaskResultResponse>(`/api/tasks/${taskId}/result`),
  cancelTask: (taskId: string) => api.post(`/api/tasks/${taskId}/cancel`),
  deleteTask: (taskId: string) => api.delete(`/api/tasks/${taskId}`)
};

export const roadmapApi = {
  generate: (data: { goal: string; deadline: string; detailLevel: number }) => 
    api.post('/roadmap/generate', data)
};

export const knowledgeApi = {
  getItems: () => api.get<KnowledgeItem[]>('/api/knowledge'),
  getFile: (id: string) => api.get<KnowledgeItem>(`/api/knowledge/${id}`),
  createFile: (data: KnowledgeItem) => api.post<KnowledgeItem>('/api/knowledge/file', data),
  createFolder: (name: string, parentId: string | null) => 
    api.post<KnowledgeItem>('/api/knowledge/folder', { name, parentId }),
  updateItem: (id: string, data: KnowledgeItem) => 
    api.put<KnowledgeItem>(`/api/knowledge/${id}`, data),
  deleteItem: (id: string, isFolder: boolean) => 
    api.delete(`/api/knowledge/${id}${isFolder ? '?type=folder' : ''}`),
  moveItem: (id: string, targetFolderId: string | null) => 
    api.post(`/api/knowledge/${id}/move`, { targetFolderId })
};
