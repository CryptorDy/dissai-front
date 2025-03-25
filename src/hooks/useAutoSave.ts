import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Хук для автоматического сохранения контента с использованием debounce
 * @param content Контент для сохранения
 * @param saveFunction Функция сохранения
 * @param delay Задержка в миллисекундах перед сохранением (по умолчанию 800)
 * @param autoSaveEnabled Флаг, включено ли автосохранение
 * @param itemId Идентификатор элемента для сохранения (опционально)
 * @returns Объект с функциями и состоянием автосохранения
 */
export function useAutoSave<T, R = void>(
  content: T,
  saveFunction: (data: T, itemId?: string) => Promise<R>,
  delay = 800,
  autoSaveEnabled = true,
  itemId?: string
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState<T>(content);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [lastSaveResult, setLastSaveResult] = useState<R | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<T>(content);
  const pendingSaveRef = useRef<boolean>(false);

  // Обновляем ссылку на текущий контент
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Сбрасываем таймер при размонтировании компонента
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Функция проверки необходимости сохранения
  const shouldSave = useCallback(() => {
    if (isSaving || pendingSaveRef.current) {
      return false;
    }
    
    try {
      const lastContentStr = JSON.stringify(lastSavedContent);
      const currentContentStr = JSON.stringify(contentRef.current);
      return lastContentStr !== currentContentStr;
    } catch (e) {
      return lastSavedContent !== contentRef.current;
    }
  }, [isSaving, lastSavedContent]);

  // Функция сохранения контента
  const saveContent = useCallback(async () => {
    if (!shouldSave()) {
      return null;
    }
    
    try {
      pendingSaveRef.current = false;
      setIsSaving(true);
      setSaveError(null);
      
      const result = await saveFunction(contentRef.current, itemId);
      setLastSavedContent(contentRef.current);
      setLastSaveResult(result);
      return result;
    } catch (error) {
      console.error('Error during autosave:', error);
      setSaveError(error instanceof Error ? error : new Error('Ошибка сохранения'));
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [saveFunction, shouldSave, itemId]);

  // Функция для запуска debounced сохранения
  const debouncedSave = useCallback(() => {
    if (!autoSaveEnabled) return;
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    pendingSaveRef.current = true;
    
    timerRef.current = setTimeout(() => {
      saveContent().catch(e => {
        console.error('Ошибка при автосохранении:', e);
      });
    }, delay);
  }, [autoSaveEnabled, delay, saveContent]);

  // Отслеживаем изменения контента для автосохранения
  useEffect(() => {
    if (autoSaveEnabled && shouldSave()) {
      debouncedSave();
    }
  }, [content, autoSaveEnabled, debouncedSave, shouldSave]);

  // Функция для принудительного сохранения
  const forceSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (shouldSave()) {
      return saveContent();
    }
    return null;
  }, [saveContent, shouldSave]);

  return {
    isSaving,
    saveError,
    forceSave,
    lastSavedContent,
    lastSaveResult
  };
} 