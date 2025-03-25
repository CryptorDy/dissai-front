import { knowledgeApi, KnowledgeItem } from './api';

/**
 * Тип функции сохранения контента
 */
export type SaveFunction = (data: any, itemId?: string) => Promise<any>;

/**
 * Сервис автосохранения для базы знаний
 */
class AutoSaveService {
  private static instance: AutoSaveService;
  private saveFunctions: Map<string, SaveFunction> = new Map();
  
  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): AutoSaveService {
    if (!AutoSaveService.instance) {
      AutoSaveService.instance = new AutoSaveService();
    }
    return AutoSaveService.instance;
  }
  
  /**
   * Зарегистрировать функцию сохранения для определенного типа элемента
   * @param itemType Тип элемента (например, 'article', 'note', etc.)
   * @param saveFunction Функция сохранения
   */
  public registerSaveFunction(itemType: string, saveFunction: SaveFunction): void {
    this.saveFunctions.set(itemType, saveFunction);
  }
  
  /**
   * Получить функцию сохранения для определенного типа элемента
   * @param itemType Тип элемента
   * @returns Функция сохранения или функция по умолчанию, использующая knowledgeApi.save
   */
  public getSaveFunction(itemType: string): SaveFunction {
    // Если для типа зарегистрирована своя функция сохранения, возвращаем её
    if (this.saveFunctions.has(itemType)) {
      return this.saveFunctions.get(itemType)!;
    }
    
    // Если нет специальной функции, используем стандартную функцию сохранения
    return this.defaultSaveFunction;
  }
  
  /**
   * Стандартная функция сохранения, использующая knowledgeApi.save
   * @param data Данные для сохранения
   * @param itemId Идентификатор элемента (опционально)
   * @returns Результат сохранения
   */
  private defaultSaveFunction = async (data: any, itemId?: string): Promise<KnowledgeItem> => {
    // Если данные уже в формате KnowledgeItem, используем их напрямую
    if (data && typeof data === 'object' && 'itemType' in data) {
      return knowledgeApi.save(data as KnowledgeItem);
    }
    
    // Если переданы только данные контента и id, формируем объект для сохранения
    if (itemId) {
      // Получаем текущий элемент для обновления только контента
      try {
        const item = await knowledgeApi.getFile(itemId);
        if (item) {
          item.content = typeof data === 'string' ? data : JSON.stringify(data);
          return knowledgeApi.save(item);
        }
      } catch (error) {
        console.error('Error retrieving item for update:', error);
        throw error;
      }
    }
    
    // Если нет достаточно информации для сохранения
    throw new Error('Недостаточно данных для сохранения элемента');
  }
  
  /**
   * Сохранить элемент с указанным типом
   * @param itemType Тип элемента
   * @param data Данные для сохранения
   * @param itemId Идентификатор элемента (опционально)
   * @returns Результат сохранения
   */
  public saveItem(itemType: string, data: any, itemId?: string): Promise<any> {
    const saveFunction = this.getSaveFunction(itemType);
    return saveFunction(data, itemId);
  }
}

// Экспортируем экземпляр сервиса
export const autoSaveService = AutoSaveService.getInstance();

// Регистрируем стандартную функцию для типа article
autoSaveService.registerSaveFunction('article', async (content: string, itemId?: string) => {
  if (!itemId) {
    throw new Error('Для сохранения статьи требуется идентификатор');
  }
  
  try {
    const item = await knowledgeApi.getFile(itemId);
    if (item) {
      item.content = content;
      return knowledgeApi.save(item);
    }
    throw new Error('Статья не найдена');
  } catch (error) {
    console.error('Error saving article:', error);
    throw error;
  }
}); 