import React, { useRef, useEffect, useState } from 'react';

// Компонент карточки с поддержкой перетаскивания
const DraggableCard = ({
  card,
  columnId,
  handleDeleteCard,
  handleCardTitleChange,
  handleCardDescriptionChange,
  handleCardPriorityChange,
  handleDragStart,
  handleDeadlineChange,
  isLastCard = false
}) => {
  // Референс для текстового поля
  const textareaRef = useRef(null);
  const dateInputRef = useRef(null);
  const datePickerContainerRef = useRef(null);
  const cardRef = useRef(null);
  
  // Функция для автоматического изменения размера текстового поля
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      // Сначала сбрасываем высоту до минимальной
      textareaRef.current.style.height = '1.5em';
      // Затем устанавливаем высоту на основе содержимого
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };
  
  // Изменение размера при изменении содержимого
  useEffect(() => {
    autoResizeTextarea();
  }, [card.description]);
  
  // Определяем цвет полоски в зависимости от приоритета и колонки
  let borderLeftColor = '#e5e7eb'; // Цвет по умолчанию - серый
  // Только для колонок "Планируется" и "Завершено" показываем цветные полоски
  if (columnId !== 'col-2') { // Не для колонки "В процессе" 
    if (card.priority === 'high') {
      borderLeftColor = '#f87171'; // Красный для высокого приоритета
    } else if (card.priority === 'medium') {
      borderLeftColor = '#fbbf24'; // Желтый для среднего приоритета
    } else if (card.priority === 'low') {
      borderLeftColor = '#60a5fa'; // Синий для низкого приоритета
    }
  }

  // Определяем классы для фона карточки
  let cardBgClass = 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-700';
  
  // Применяем цветное выделение только для колонок "Планируется" и "Завершено"
  if (columnId !== 'col-2') {
    if (card.priority === 'high') {
      cardBgClass = 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
    } else if (card.priority === 'medium') {
      cardBgClass = 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
    } else if (card.priority === 'low') {
      cardBgClass = 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
    }
  }

  // Определяем, истекает ли срок скоро или уже истек
  const hasDeadline = card.deadline && card.deadline.trim() !== '';
  let deadlineClass = 'deadline-normal';
  let isExpired = false;
  let isNearDeadline = false;
  
  if (hasDeadline) {
    const deadlineDate = new Date(card.deadline);
    const currentDate = new Date();
    const timeDiff = deadlineDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    isExpired = timeDiff < 0;
    isNearDeadline = daysRemaining >= 0 && daysRemaining <= 2;
    
    if (isExpired) {
      deadlineClass = 'deadline-expired';
    } else if (isNearDeadline) {
      deadlineClass = 'deadline-near';
    }
  }

  const marginStyle = isLastCard ? {} : { marginBottom: '15px' };

  // Форматирование даты для более читаемого вывода
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  const [isDateFocused, setIsDateFocused] = useState(false);

  // Функция для открытия выбора даты при клике на иконку
  const openDatePicker = () => {
    if (dateInputRef.current) {
      try {
        // Основной метод для современных браузеров
        dateInputRef.current.showPicker();
      } catch (error) {
        // Запасной вариант: имитируем клик
        dateInputRef.current.focus();
        const event = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        dateInputRef.current.dispatchEvent(event);
      }
    }
  };
  
  // Обработчик изменения даты
  const handleDateChange = (e) => {
    // Немедленное сохранение даты и проверка значения
    const newValue = e.target.value;
    
    // Подробное логирование для отслеживания проблемы
    const saveTimestamp = Date.now();
    console.log(`[${saveTimestamp}] Сохранение дедлайна для карточки ${card.id}:`, {
      oldValue: card.deadline,
      newValue: newValue,
      cardId: card.id
    });
    
    // Немедленное сохранение - один раз, без дополнительных попыток
    handleDeadlineChange(card.id, newValue);
    
    // Если выбрана дата, закрываем форму с небольшой задержкой
    if (newValue) {
      setTimeout(() => setIsDateFocused(false), 400);
    }
  };
  
  // Добавляем слушатель глобального события изменения дедлайна
  useEffect(() => {
    const handleGlobalDeadlineUpdate = (event) => {
      const { cardId, deadline } = event.detail;
      
      // Проверяем, относится ли обновление к текущей карточке
      if (cardId === card.id) {
        console.log(`Получено глобальное событие обновления дедлайна для карточки ${cardId}:`, deadline);
        
        // Если текущее значение не совпадает с новым, повторно вызываем обработчик
        if (card.deadline !== deadline) {
          handleDeadlineChange(cardId, deadline);
        }
      }
    };
    
    // Добавляем слушатель
    document.addEventListener('kanban-deadline-changed', handleGlobalDeadlineUpdate);
    
    // Удаляем слушатель при размонтировании
    return () => {
      document.removeEventListener('kanban-deadline-changed', handleGlobalDeadlineUpdate);
    };
  }, [card.id, card.deadline, handleDeadlineChange]);

  // Улучшенная функция закрытия форм выбора даты
  useEffect(() => {
    // Функция для проверки клика вне формы выбора даты
    const handleClickOutside = (event) => {
      // Проверка клика вне контейнера даты
      if (isDateFocused && 
          datePickerContainerRef.current && 
          !datePickerContainerRef.current.contains(event.target)) {
        setIsDateFocused(false);
      }
      
      // Проверка клика вне карточки для остальных полей
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        // Клик был вне карточки - снимаем фокус со всех полей
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };
    
    // Прослушиваем клики на документе
    document.addEventListener('mousedown', handleClickOutside);
    
    // Удаляем прослушиватель при размонтировании
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDateFocused]);

  return (
    <div 
      className="card-wrapper kanban-card-item" 
      style={marginStyle}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        handleDragStart(card.id, columnId, e);
      }}
    >
      <div
        ref={cardRef}
        className={`kanban-card p-2 rounded-md shadow-sm hover:shadow-md relative group border ${cardBgClass}`}
        onMouseDown={e => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
        }}
        style={{ 
          borderLeftWidth: '4px',
          borderLeftColor: borderLeftColor,
          cursor: 'grab'
        }}
      >
        <div className="flex justify-between items-start">
          <input
            type="text"
            value={card.title}
            onChange={(e) => handleCardTitleChange(card.id, e.target.value)}
            className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1 w-full bg-transparent border-none p-0 focus:ring-0"
            onKeyDown={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            placeholder="Введите название задачи"
          />
          <button
            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleDeleteCard(columnId, card.id)}
            onMouseDown={e => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={card.description}
          onChange={(e) => {
            handleCardDescriptionChange(card.id, e.target.value);
            // Автоматическое изменение размера уже происходит в эффекте
          }}
          className="text-xs text-gray-500 dark:text-gray-400 w-full bg-transparent border-none p-0 focus:ring-0 resize-none"
          rows={1}
          onKeyDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          placeholder="Введите описание задачи"
        />
        
        {/* Поле для дедлайна */}
        <div className="flex flex-col mt-2">
          {/* Если дедлайна нет и поле не в фокусе, показываем кнопку добавления дедлайна */}
          {!hasDeadline && !isDateFocused && (
            <button
              className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDateFocused(true);
                setTimeout(() => {
                  if (dateInputRef.current) {
                    dateInputRef.current.focus();
                    openDatePicker();
                  }
                }, 10);
              }}
              onMouseDown={e => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              Добавить дедлайн
            </button>
          )}
          
          {/* Если дедлайн установлен, показываем дату дедлайна с возможностью клика */}
          {hasDeadline && !isDateFocused && (
            <button
              className={`text-xs flex items-center ${deadlineClass} hover:opacity-80 rounded px-1`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDateFocused(true);
                setTimeout(() => {
                  if (dateInputRef.current) {
                    dateInputRef.current.focus();
                    openDatePicker();
                  }
                }, 10);
              }}
              onMouseDown={e => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              {isExpired ? 'Срок истек: ' : 'Срок: '}
              {formatDate(card.deadline)}
            </button>
          )}
          
          {/* Показываем поле ввода даты только когда оно в фокусе */}
          {isDateFocused && (
            <div 
              className="flex items-center relative" 
              ref={datePickerContainerRef} 
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
            >
              <input
                ref={dateInputRef}
                type="date"
                value={card.deadline || ''}
                onChange={handleDateChange}
                onFocus={() => setIsDateFocused(true)}
                onKeyDown={e => {
                  e.stopPropagation();
                  if (e.key === 'Escape') {
                    setIsDateFocused(false);
                  } else if (e.key === 'Enter') {
                    setIsDateFocused(false);
                  }
                }}
                className="text-xs bg-transparent border border-gray-200 dark:border-gray-600 rounded p-1 pr-6 focus:ring-0 focus:border-blue-500 deadline-input"
              />
              <button 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  openDatePicker();
                }}
                onMouseDown={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
          <select
            value={card.priority || 'none'}
            onChange={(e) => handleCardPriorityChange(card.id, e.target.value)}
            className="text-xs bg-transparent border-none focus:ring-0 p-0 pr-4 text-gray-500 dark:text-gray-400"
            onMouseDown={e => e.stopPropagation()}
          >
            <option value="none">Без приоритета</option>
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
          
          {card.priority && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              card.priority === 'high' 
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : card.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {card.priority === 'low' ? 'Низкий' : card.priority === 'medium' ? 'Средний' : 'Высокий'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraggableCard;