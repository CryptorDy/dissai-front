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
  // Добавляем логирование входных данных
  console.log('mapApiItemToKnowledgeItem: Входные данные:', JSON.stringify(item));
  
  if (!item) {
    console.error('mapApiItemToKnowledgeItem: Получен пустой объект!');
    return {
      id: '',
      itemType: 'file' as 'file',
      name: 'Ошибка загрузки',
      parentId: null
    };
  }
  
  // Логируем id перед его использованием
  console.log('mapApiItemToKnowledgeItem: ID в ответе:', item.id);
  
  const result: KnowledgeItem = {
    id: item.id || '', // Используем пустую строку, если id не определен
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
  
  // Логируем результат 
  console.log('mapApiItemToKnowledgeItem: Результат преобразования:', JSON.stringify(result));
  
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
      return items;
    } 
    // Если ответ уже является массивом
    else if (Array.isArray(response.data)) {
      // Проверяем формат первого элемента, чтобы понять, нужно ли преобразование CamelCase
      if (response.data.length > 0 && response.data[0] && typeof response.data[0] === 'object' && 'Id' in response.data[0]) {
        return response.data.map(item => mapCamelCaseToKnowledgeItemDto(item))
          .map(item => mapApiItemToKnowledgeItem(item));
      } else {
        return response.data.map(item => mapApiItemToKnowledgeItem(item as KnowledgeItemDto));
      }
    }
    
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
    console.log('knowledgeApi.save: Начало запроса с данными:', JSON.stringify(data));
    const serverData = mapKnowledgeItemToApi(data);
    console.log('knowledgeApi.save: Данные для отправки на сервер:', JSON.stringify(serverData));
    
    return api.post<KnowledgeItemDto | any>('/knowledge/save', serverData)
      .then(response => {
        console.log('knowledgeApi.save: Получен ответ от сервера:', JSON.stringify(response.data));
        
        // Проверяем формат данных ответа
        if (response.data && typeof response.data === 'object') {
          // Проверяем, если данные в CamelCase формате (UpperCase)
          if ('Id' in response.data) {
            console.log('knowledgeApi.save: Обнаружен CamelCase формат ответа');
            const normalizedData = mapCamelCaseToKnowledgeItemDto(response.data);
            return mapApiItemToKnowledgeItem(normalizedData);
          } 
          // Проверяем наличие id в ответе
          else if (!response.data.id) {
            console.error('knowledgeApi.save: В ответе сервера отсутствует id!', response.data);
            // Если id отсутствует, но есть другие идентификаторы, пробуем их использовать
            if (response.data.Id) {
              console.log('knowledgeApi.save: Найден Id в CamelCase формате');
              const responseAny = response.data as any;
              responseAny.id = responseAny.Id;
            } else if (response.data._id) {
              console.log('knowledgeApi.save: Найден _id формат');
              const responseAny = response.data as any;
              responseAny.id = responseAny._id;
            }
          }
        } else {
          console.error('knowledgeApi.save: Неожиданный формат ответа от сервера:', response.data);
        }
        
        const result = mapApiItemToKnowledgeItem(response.data);
        console.log('knowledgeApi.save: Итоговый результат:', JSON.stringify(result));
        return result;
      })
      .catch(error => {
        console.error('knowledgeApi.save: Ошибка при выполнении запроса:', error);
        throw error;
      });
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