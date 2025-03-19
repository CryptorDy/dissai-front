import axios from 'axios';
import { TaskListResponse, TaskResultResponse } from '../types/generation';
import { API_URL } from '../config/api';

export interface KnowledgeItem {
  id: string;
  itemType: 'file' | 'folder';
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

// Интерфейс для элементов в ответе API
interface KnowledgeItemDto {
  id: string;
  itemType: string;
  fileType: string | null;
  name: string;
  content: string | null;
  children: KnowledgeItemDto[];
  parentId: string | null;
  userId: string;
  metadata: any;
}

// Интерфейс для корневого объекта в ответе API
interface KnowledgeRootDto {
  Id: string;
  ItemType: string;
  FileType: string | null;
  Name: string;
  Content: string | null;
  Children: {
    Id: string;
    ItemType: string;
    FileType: string | null;
    Name: string;
    Content: string | null;
    Children: any[];
    ParentId: string | null;
    UserId: string;
  }[];
  ParentId: string | null;
  UserId: string;
}

// Вспомогательная функция для преобразования элемента API с CamelCase-именами полей в KnowledgeItemDto
function mapCamelCaseToKnowledgeItemDto(item: any): KnowledgeItemDto {
  return {
    id: item.Id,
    itemType: item.ItemType,
    fileType: item.FileType,
    name: item.Name,
    content: item.Content,
    children: Array.isArray(item.Children) 
      ? item.Children.map(mapCamelCaseToKnowledgeItemDto) 
      : [],
    parentId: item.ParentId,
    userId: item.UserId,
    metadata: item.Metadata
  };
}

// Вспомогательная функция для преобразования KnowledgeItem в формат API
function mapKnowledgeItemToApi(item: KnowledgeItem): any {
  return {
    id: item.id,
    itemType: item.itemType,
    fileType: item.itemType === 'file' ? (item.fileType || null) : null,
    name: item.name,
    content: item.content || null,
    parentId: item.parentId,
    children: item.children ? item.children.map(child => mapKnowledgeItemToApi(child)) : [],
    metadata: item.metadata
  };
}

// Вспомогательная функция для преобразования API элемента в KnowledgeItem
function mapApiItemToKnowledgeItem(item: KnowledgeItemDto): KnowledgeItem {
  console.log('mapApiItemToKnowledgeItem вызван с:', item);
  
  if (!item) {
    return {
      id: '',
      itemType: 'file' as 'file',
      name: 'Ошибка загрузки',
      parentId: null
    };
  }
  
  const result: KnowledgeItem = {
    id: item.id,
    itemType: (item.itemType === 'folder' ? 'folder' : 'file') as 'file' | 'folder',
    name: item.name,
    fileType: item.fileType || undefined,
    content: item.content || undefined,
    // Рекурсивно преобразуем дочерние элементы
    children: item.children && Array.isArray(item.children) 
      ? item.children.map(child => mapApiItemToKnowledgeItem(child)) 
      : undefined,
    parentId: item.parentId,
    metadata: item.metadata
  };
  
  return result;
}

export const knowledgeApi = {
  // Получение структуры дерева
  getItems: () => api.get<KnowledgeRootDto | KnowledgeItemDto[]>('/knowledge').then(response => {
    
    // Проверяем, является ли ответ корневым объектом с Children
    if (response.data && typeof response.data === 'object' && 'Children' in response.data && Array.isArray(response.data.Children)) {
      // Преобразуем элементы из Children с CamelCase-именами в KnowledgeItemDto
      const items = response.data.Children.map(item => mapCamelCaseToKnowledgeItemDto(item))
        .map(item => mapApiItemToKnowledgeItem(item));
      console.log('Processed items:', items);
      return items;
    } 
    // Если ответ уже является массивом
    else if (Array.isArray(response.data)) {
      // Проверяем формат первого элемента, чтобы понять, нужно ли преобразование CamelCase
      if (response.data.length > 0 && response.data[0] && typeof response.data[0] === 'object' && 'Id' in response.data[0]) {
        return response.data.map(item => mapCamelCaseToKnowledgeItemDto(item))
          .map(item => mapApiItemToKnowledgeItem(item));
      } else {
        console.log('Processing regular array');
        return response.data.map(item => mapApiItemToKnowledgeItem(item as KnowledgeItemDto));
      }
    }
    
    console.log('No valid data format found, returning empty array');
    return [];
  }),
  
  // Получение файла по ID
  getFile: (id: string) => {
    return api.get<KnowledgeItemDto | any>(`/knowledge/file/${id}`)
      .then(response => {
        
        // Проверяем, нужно ли преобразование из CamelCase
        if (response.data && typeof response.data === 'object' && 'Id' in response.data) {
          const normalizedData = mapCamelCaseToKnowledgeItemDto(response.data);
          return mapApiItemToKnowledgeItem(normalizedData);
        } else {
          // Если данные уже в нужном формате
          return mapApiItemToKnowledgeItem(response.data);
        }
      })
      .catch(error => {
        throw error;
      });
  },
  
  // Создание или обновление элемента
  save: (data: KnowledgeItem) => {
    const serverData = mapKnowledgeItemToApi(data);
    return api.post<KnowledgeItemDto>('/knowledge/save', serverData)
      .then(response => mapApiItemToKnowledgeItem(response.data));
  },
  
  // Перемещение элемента к новому родителю
  moveItem: (id: string, targetParentId: string | null, itemType?: 'file' | 'folder') => 
    api.post('/knowledge/move', { 
      id, 
      itemType: itemType || 'file',
      targetParentId 
    }).then(response => response.data),
  
  // Удаление элемента
  deleteItem: (id: string) => 
    api.delete(`/knowledge/${id}`).then(response => response.data),
  
  // Обновление элемента (альтернатива для save, если требуется отдельный метод)
  updateItem: (id: string, data: KnowledgeItem) => {
    const serverData = mapKnowledgeItemToApi(data);
    // Используем метод save, так как он теперь поддерживает как создание, так и обновление
    return api.post<KnowledgeItemDto>('/knowledge/save', serverData)
      .then(response => mapApiItemToKnowledgeItem(response.data));
  }
};