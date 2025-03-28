/**
 * Сервис для работы с локальным хранилищем, кэширования файлов и обеспечения сохранности данных
 */

interface StoredFile {
  id: string;
  content: string;
  lastModified: number;
}

class LocalStorageService {
  private readonly STORAGE_KEY = 'dissai_files_cache';
  private readonly USER_SESSION_KEY = 'dissai_user_session';
  private readonly MAX_FILES = 7; // Максимальное количество кэшируемых файлов

  /**
   * Получение всех сохраненных файлов из локального хранилища
   */
  getStoredFiles(): StoredFile[] {
    try {
      const filesData = localStorage.getItem(this.STORAGE_KEY);
      if (!filesData) return [];
      
      return JSON.parse(filesData);
    } catch (error) {
      console.error('Ошибка при чтении файлов из локального хранилища:', error);
      return [];
    }
  }

  /**
   * Сохранение массива файлов в локальное хранилище
   */
  private setStoredFiles(files: StoredFile[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
    } catch (error) {
      console.error('Ошибка при сохранении файлов в локальное хранилище:', error);
    }
  }

  /**
   * Сохранение или обновление файла в локальном хранилище
   * @param id Идентификатор файла
   * @param content Содержимое файла
   */
  saveFile(id: string, content: string): void {
    if (!id || id.startsWith('temp-')) return; // Не сохраняем файлы с временными ID

    try {
      let files = this.getStoredFiles();
      
      // Поиск существующего файла
      const fileIndex = files.findIndex(file => file.id === id);
      
      if (fileIndex >= 0) {
        // Обновляем существующий файл
        files[fileIndex] = {
          id,
          content,
          lastModified: Date.now()
        };
      } else {
        // Добавляем новый файл
        files.push({
          id,
          content,
          lastModified: Date.now()
        });
        
        // Проверяем лимит файлов
        if (files.length > this.MAX_FILES) {
          // Сортируем по времени последнего изменения (старые - в начале)
          files.sort((a, b) => a.lastModified - b.lastModified);
          // Удаляем самый старый файл
          files.shift();
        }
      }
      
      this.setStoredFiles(files);
    } catch (error) {
      console.error('Ошибка при сохранении файла в локальное хранилище:', error);
    }
  }

  /**
   * Получение содержимого файла из локального хранилища
   * @param id Идентификатор файла
   * @returns Содержимое файла или null, если файл не найден
   */
  getFile(id: string): string | null {
    if (!id || id.startsWith('temp-')) return null;

    try {
      const files = this.getStoredFiles();
      const file = files.find(file => file.id === id);
      
      return file ? file.content : null;
    } catch (error) {
      console.error('Ошибка при получении файла из локального хранилища:', error);
      return null;
    }
  }

  /**
   * Очистка хранилища файлов
   */
  clearStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.USER_SESSION_KEY);
    } catch (error) {
      console.error('Ошибка при очистке локального хранилища:', error);
    }
  }

  /**
   * Инициализация сессии пользователя
   * @param userId ID пользователя
   */
  initSession(userId: string): void {
    try {
      localStorage.setItem(this.USER_SESSION_KEY, userId);
    } catch (error) {
      console.error('Ошибка при инициализации сессии:', error);
    }
  }

  /**
   * Проверка сессии пользователя
   * @param userId Текущий ID пользователя
   * @returns true, если сессия совпадает, false - если нет
   */
  checkSession(userId: string): boolean {
    try {
      const storedUserId = localStorage.getItem(this.USER_SESSION_KEY);
      
      // Если ID пользователя изменился, очищаем кэш
      if (storedUserId && storedUserId !== userId) {
        this.clearStorage();
        this.initSession(userId);
        return false;
      }
      
      return storedUserId === userId;
    } catch (error) {
      console.error('Ошибка при проверке сессии:', error);
      return false;
    }
  }
}

// Экспортируем экземпляр сервиса
export const localStorageService = new LocalStorageService(); 