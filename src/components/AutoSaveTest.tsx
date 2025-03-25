import React, { useState, useCallback, useEffect } from 'react';
import { useAutoSave, useIdleDetection } from '../hooks';
import { autoSaveService } from '../services/autoSaveService';

interface AutoSaveTestProps {
  initialContent?: string;
  itemId?: string;
  autoSave?: boolean;
}

// Интерфейс для результата сохранения
interface SaveResult {
  success: boolean;
  timestamp: Date;
}

export function AutoSaveTest({
  initialContent = '',
  itemId,
  autoSave = true
}: AutoSaveTestProps) {
  const [content, setContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Инициализация автосохранения с типизированным результатом
  const { isSaving, saveError, forceSave, lastSaveResult } = useAutoSave<string, SaveResult>(
    content,
    async (contentToSave: string, id?: string): Promise<SaveResult> => {
      console.log(`Тестовое автосохранение с ID ${id || itemId}`);
      
      // Имитация задержки сохранения для демонстрации
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Имитация ошибки с вероятностью 10%
      if (Math.random() < 0.1) {
        throw new Error('Случайная ошибка сохранения (демонстрация)');
      }
      
      return { success: true, timestamp: new Date() };
    },
    800, // Увеличиваем задержку до 800 мс
    false, // Управляем через useIdleDetection
    itemId
  );
  
  // При изменении результата сохранения обновляем lastSaved
  useEffect(() => {
    if (lastSaveResult) {
      setLastSaved(lastSaveResult.timestamp);
      setHasChanges(false); // Сбрасываем флаг изменений после успешного сохранения
    }
  }, [lastSaveResult]);
  
  // Функция для сохранения при бездействии
  const handleIdleSave = useCallback(() => {
    if (autoSave && hasChanges && !isSaving) {
      console.log('Автосохранение после периода бездействия...');
      forceSave().catch(error => {
        console.error('Ошибка при автосохранении:', error);
      });
    }
  }, [autoSave, hasChanges, isSaving, forceSave]);
  
  // Инициализация обнаружения бездействия
  const { isIdle } = useIdleDetection(
    800, // Увеличиваем задержку до 800мс бездействия
    handleIdleSave, // вызываем сохранение при бездействии
    ['keydown'] // Отслеживаем ТОЛЬКО нажатия клавиш, игнорируем мышь
  );
  
  // Обработчик изменения текста
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setHasChanges(true);
  };
  
  // Обработчик принудительного сохранения
  const handleManualSave = () => {
    forceSave().catch(error => {
      console.error('Ошибка при ручном сохранении:', error);
    });
  };
  
  // Обновляем статус сохранения на основе состояния автосохранения
  useEffect(() => {
    if (isSaving) {
      setSaveStatus('saving');
    } else if (saveError) {
      setSaveStatus('error');
    } else if (saveStatus === 'saving') {
      setSaveStatus('saved');
      
      // Сбрасываем статус "saved" через 2 секунды
      const timer = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isSaving, saveError, saveStatus]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Тест автосохранения
        </h2>
      </div>
      
      <div className="mb-4">
        <textarea
          value={content}
          onChange={handleTextChange}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={6}
          placeholder="Начните печатать что-нибудь... Автосохранение сработает через 800 мс после остановки печати"
        />
      </div>
      
      <div className="flex justify-between items-center">
        <button
          onClick={handleManualSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? 'Сохранение...' : 'Принудительно сохранить'}
        </button>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {lastSaved ? (
            <>
              Последнее сохранение: {lastSaved.toLocaleTimeString()}
            </>
          ) : (
            <>Нет сохранений</>
          )}
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm text-gray-700 dark:text-gray-300">
        <div><strong>Состояние:</strong> {isIdle ? 'Бездействие' : 'Активность'}</div>
        <div><strong>Есть изменения:</strong> {hasChanges ? 'Да' : 'Нет'}</div>
        <div><strong>Идет сохранение:</strong> {isSaving ? 'Да' : 'Нет'}</div>
        <div><strong>Автосохранение:</strong> {autoSave ? 'Включено' : 'Отключено'}</div>
        {itemId && <div><strong>Item ID:</strong> {itemId}</div>}
      </div>
    </div>
  );
} 