import React, { useRef, useEffect } from 'react';

// Компонент карточки с поддержкой перетаскивания
const DraggableCard = ({
  card,
  columnId,
  handleDeleteCard,
  handleCardTitleChange,
  handleCardDescriptionChange,
  handleCardPriorityChange,
  handleDragStart,
  isLastCard = false
}) => {
  // Референс для текстового поля
  const textareaRef = useRef(null);
  
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

  const marginStyle = isLastCard ? {} : { marginBottom: '15px' };

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