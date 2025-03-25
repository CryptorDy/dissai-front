import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Хук для отслеживания бездействия пользователя.
 * Вызывает callback после указанного периода бездействия.
 * 
 * @param idleTime Время бездействия в миллисекундах (по умолчанию 800 мс)
 * @param onIdle Callback-функция, которая будет вызвана при бездействии
 * @param events Массив событий, которые считаются активностью (по умолчанию только keydown)
 * @returns Объект с методами для управления отслеживанием бездействия
 */
export function useIdleDetection(
  idleTime: number = 800,
  onIdle?: () => void,
  events: string[] = ['keydown'] // По умолчанию только события клавиатуры
) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isProcessingRef = useRef<boolean>(false); // Предотвращаем частые вызовы
  
  // Сбрасывает таймер бездействия
  const resetTimer = useCallback(() => {
    // Предотвращаем множественные вызовы в короткий промежуток времени
    if (isProcessingRef.current) {
      return;
    }
    
    isProcessingRef.current = true;
    
    // Если таймер уже запущен, отменяем его
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Обновляем время последней активности
    lastActivityRef.current = Date.now();
    
    // Если был в состоянии бездействия, сбрасываем это состояние
    if (isIdle) {
      setIsIdle(false);
    }
    
    // Запускаем новый таймер
    timerRef.current = setTimeout(() => {
      setIsIdle(true);
      if (onIdle) {
        onIdle();
      }
    }, idleTime);
    
    // Разрешаем обработку после небольшой задержки
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 50);
  }, [idleTime, isIdle, onIdle]);
  
  // Добавляем слушатели событий активности
  useEffect(() => {
    // Обработчик события активности для клавиатуры
    const handleKeyboardActivity = () => {
      resetTimer();
    };
    
    // Обработчик события активности для мыши (если нужен)
    const handleMouseActivity = (e: MouseEvent) => {
      // Игнорируем события движения мыши и прокрутки 
      // Реагируем только на клики и другие важные события
      if (e.type === 'mousedown' || e.type === 'mouseup') {
        resetTimer();
      }
    };
    
    // Добавляем слушатели для всех указанных событий
    events.forEach(eventName => {
      // Разделяем события клавиатуры и мыши
      if (eventName.startsWith('key')) {
        window.addEventListener(eventName, handleKeyboardActivity);
      } else if (eventName.startsWith('mouse')) {
        window.addEventListener(eventName, handleMouseActivity as EventListener);
      } else {
        window.addEventListener(eventName, resetTimer);
      }
    });
    
    // Инициализируем таймер при монтировании
    resetTimer();
    
    // Очистка при размонтировании
    return () => {
      // Удаляем слушатели событий
      events.forEach(eventName => {
        if (eventName.startsWith('key')) {
          window.removeEventListener(eventName, handleKeyboardActivity);
        } else if (eventName.startsWith('mouse')) {
          window.removeEventListener(eventName, handleMouseActivity as EventListener);
        } else {
          window.removeEventListener(eventName, resetTimer);
        }
      });
      
      // Отменяем таймер
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resetTimer, events]);
  
  // Функция для принудительного сброса таймера
  const triggerActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);
  
  // Функция для принудительного перехода в состояние бездействия
  const triggerIdle = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsIdle(true);
    if (onIdle) {
      onIdle();
    }
  }, [onIdle]);
  
  return {
    isIdle,
    lastActivity: lastActivityRef.current,
    triggerActivity,
    triggerIdle
  };
} 