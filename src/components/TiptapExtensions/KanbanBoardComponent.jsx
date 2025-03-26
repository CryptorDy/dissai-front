import React, { useState, useCallback, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

// Удалено использование react-dnd
// import { useDrag, useDrop } from 'react-dnd';

// Стили компонента
import './KanbanBoardComponent.css';

// Вспомогательная функция для генерации ID
const generateId = () => `id-${Math.random().toString(36).substr(2, 9)}`;

// Компонент карточки с поддержкой перетаскивания
const DraggableCard = ({ card, columnId, handleDeleteCard, handleCardTitleChange, handleCardDescriptionChange, handleCardPriorityChange, handleDragStart }) => {
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

  return (
    <div 
      className="card-wrapper" 
      style={{ marginBottom: '15px' }}
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
          value={card.description}
          onChange={(e) => handleCardDescriptionChange(card.id, e.target.value)}
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

// Компонент колонки с поддержкой drop
const DroppableColumn = ({ column, cards, handleColumnTitleChange, handleAddCard, handleDeleteCard, handleCardTitleChange, handleCardDescriptionChange, handleCardPriorityChange, handleDragStart, handleDrop, isFirstColumn }) => {
  return (
    <div
      className="kanban-column bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDrop(column.id, e);
      }}
    >
      <div className="kanban-column-header flex items-center justify-between mb-3">
        <input
          type="text"
          value={column.title}
          onChange={(e) => handleColumnTitleChange(column.id, e.target.value)}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent border-none p-0 focus:ring-0 w-full"
          onMouseDown={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        />
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {cards.length}
        </span>
      </div>

      <div className="min-h-[100px]">
        {cards.map((card, index) => (
          <DraggableCard
            key={card.id}
            card={card}
            columnId={column.id}
            handleDeleteCard={handleDeleteCard}
            handleCardTitleChange={handleCardTitleChange}
            handleCardDescriptionChange={handleCardDescriptionChange}
            handleCardPriorityChange={handleCardPriorityChange}
            handleDragStart={handleDragStart}
          />
        ))}
      </div>

      {/* Кнопка добавления только в первой колонке (Планируется) */}
      {isFirstColumn && (
        <button
          className="mt-4 text-sm text-white bg-blue-500 hover:bg-blue-600 py-1 px-3 rounded-md w-full transition-colors"
          onClick={() => handleAddCard(column.id)}
          onMouseDown={e => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          + Добавить задачу
        </button>
      )}
    </div>
  );
};

const KanbanBoardComponent = (props) => {
  const { node, updateAttributes, editor } = props;
  
  // Состояние для drag and drop
  const [draggedCardId, setDraggedCardId] = useState(null);
  const [draggedFromColumnId, setDraggedFromColumnId] = useState(null);

  // Инициализируем состояние из атрибутов ноды Tiptap
  const initialBoardState = node.attrs.boardState || {
    columns: [
      { id: 'col-1', title: 'Планируется', cardIds: ['card-1', 'card-2'] },
      { id: 'col-2', title: 'В процессе', cardIds: ['card-3'] },
      { id: 'col-3', title: 'Завершено', cardIds: [] },
    ],
    cards: {
      'card-1': { id: 'card-1', title: 'Задача 1', description: 'Описание задачи 1', priority: 'medium' },
      'card-2': { id: 'card-2', title: 'Задача 2', description: 'Описание задачи 2', priority: 'low' },
      'card-3': { id: 'card-3', title: 'Задача 3', description: 'Описание задачи 3', priority: 'high' },
    },
    columnOrder: ['col-1', 'col-2', 'col-3'],
    boardTitle: 'Канбан-доска проекта',
  };

  const [boardState, setBoardState] = useState(initialBoardState);
  const [filterText, setFilterText] = useState('');
  const [filterPriority, setFilterPriority] = useState(null);

  // Функция для сохранения состояния в TipTap
  const saveStateToTiptap = useCallback((newState) => {
    if (!editor.isEditable) return;
    updateAttributes({
      boardState: newState,
    });
  }, [updateAttributes, editor.isEditable]);

  // Обработчики событий

  // Начало перетаскивания карточки
  const handleDragStart = (cardId, sourceColumnId, e) => {
    setDraggedCardId(cardId);
    setDraggedFromColumnId(sourceColumnId);
    
    // Добавляем данные в dataTransfer для обработки при drop
    e.dataTransfer.setData('application/kanban', JSON.stringify({
      cardId,
      sourceColumnId
    }));
    
    // Устанавливаем вид курсора
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Обработка событий drop
  const handleDrop = (destinationColumnId) => {
    if (draggedCardId && draggedFromColumnId && draggedFromColumnId !== destinationColumnId) {
      moveCard(draggedCardId, draggedFromColumnId, destinationColumnId);
      
      // Сбрасываем состояние перетаскивания
      setDraggedCardId(null);
      setDraggedFromColumnId(null);
    }
  };

  // Изменение заголовка карточки
  const handleCardTitleChange = (cardId, newTitle) => {
    const newState = {
      ...boardState,
      cards: {
        ...boardState.cards,
        [cardId]: {
          ...boardState.cards[cardId],
          title: newTitle,
        },
      },
    };
    setBoardState(newState);
    saveStateToTiptap(newState);
  };

  // Изменение описания карточки
  const handleCardDescriptionChange = (cardId, newDescription) => {
    const newState = {
      ...boardState,
      cards: {
        ...boardState.cards,
        [cardId]: {
          ...boardState.cards[cardId],
          description: newDescription,
        },
      },
    };
    setBoardState(newState);
    saveStateToTiptap(newState);
  };

  // Изменение приоритета карточки
  const handleCardPriorityChange = (cardId, newPriority) => {
    const newState = {
      ...boardState,
      cards: {
        ...boardState.cards,
        [cardId]: {
          ...boardState.cards[cardId],
          priority: newPriority === 'none' ? undefined : newPriority,
        },
      },
    };
    setBoardState(newState);
    saveStateToTiptap(newState);
  };

  // Изменение заголовка колонки
  const handleColumnTitleChange = (columnId, newTitle) => {
    const newState = {
      ...boardState,
      columns: boardState.columns.map(col => 
        col.id === columnId ? { ...col, title: newTitle } : col
      )
    };
    setBoardState(newState);
    saveStateToTiptap(newState);
  };

  // Добавление новой карточки
  const handleAddCard = (columnId) => {
    const newCardId = `card-${generateId()}`;
    const newCard = {
      id: newCardId,
      title: 'Новая задача',
      description: 'Описание задачи'
    };
    
    const newState = {
      ...boardState,
      cards: {
        ...boardState.cards,
        [newCardId]: newCard,
      },
      columns: boardState.columns.map(col =>
        col.id === columnId
          ? { ...col, cardIds: [...col.cardIds, newCardId] }
          : col
      ),
    };
    
    setBoardState(newState);
    saveStateToTiptap(newState);
  };

  // Удаление карточки
  const handleDeleteCard = (columnId, cardId) => {
    const newColumns = boardState.columns.map(col =>
      col.id === columnId
        ? { ...col, cardIds: col.cardIds.filter(id => id !== cardId) }
        : col
    );
    
    const newCards = { ...boardState.cards };
    delete newCards[cardId];
    
    const newState = {
      ...boardState,
      cards: newCards,
      columns: newColumns,
    };
    
    setBoardState(newState);
    saveStateToTiptap(newState);
  };

  // Перемещение карточки между колонками
  const moveCard = (cardId, sourceColumnId, destinationColumnId) => {
    // Получаем исходную и целевую колонки
    const sourceColumn = boardState.columns.find(col => col.id === sourceColumnId);
    const destinationColumn = boardState.columns.find(col => col.id === destinationColumnId);
    
    if (!sourceColumn || !destinationColumn) return;

    // Создаем новые массивы ID карточек для обеих колонок
    const sourceCardIds = [...sourceColumn.cardIds].filter(id => id !== cardId);
    const destinationCardIds = [...destinationColumn.cardIds];
    
    // Добавляем ID карточки в целевую колонку
    destinationCardIds.push(cardId);
    
    // Обновляем состояние
    const newState = {
      ...boardState,
      columns: boardState.columns.map(col => {
        if (col.id === sourceColumnId) {
          return { ...col, cardIds: sourceCardIds };
        }
        if (col.id === destinationColumnId) {
          return { ...col, cardIds: destinationCardIds };
        }
        return col;
      }),
    };
    
    setBoardState(newState);
    saveStateToTiptap(newState);
  };

  // Фильтрация карточек
  const filteredCards = (columnId, cardIds) => {
    return cardIds
      .map(cardId => boardState.cards[cardId])
      .filter(card => {
        if (!card) return false;
        
        // Фильтр по тексту
        const textMatch = !filterText || 
          card.title.toLowerCase().includes(filterText.toLowerCase()) || 
          card.description.toLowerCase().includes(filterText.toLowerCase());
        
        // Фильтр по приоритету
        const priorityMatch = !filterPriority || card.priority === filterPriority;
        
        return textMatch && priorityMatch;
      });
  };

  // Статистика задач
  const calculateStats = () => {
    const total = Object.keys(boardState.cards).length;
    const completed = boardState.columns.find(col => col.id === 'col-3')?.cardIds.length || 0;
    const inProgress = boardState.columns.find(col => col.id === 'col-2')?.cardIds.length || 0;
    const planned = boardState.columns.find(col => col.id === 'col-1')?.cardIds.length || 0;
    
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, inProgress, planned, completionPercentage };
  };

  const stats = calculateStats();

  // Изменение заголовка доски
  const handleBoardTitleChange = (newTitle) => {
    const newState = {
      ...boardState,
      boardTitle: newTitle
    };
    setBoardState(newState);
    saveStateToTiptap(newState);
  };

  // Рендеринг компонента
  return (
    <NodeViewWrapper 
      className="interactive-kanban-wrapper p-1 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg"
      contentEditable={false}
    >
      {/* Добавляем обертку с предотвращением событий */}
      <div 
        contentEditable={false}
        className="kanban-board-react-content not-prose"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          return false;
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          return false;
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          e.preventDefault();
          return false;
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          return false;
        }}
      >
        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="text-lg font-medium text-gray-900 dark:text-white mb-2 md:mb-0 w-1/3">
            <input
              type="text"
              value={boardState.boardTitle}
              onChange={(e) => {
                e.stopPropagation();
                handleBoardTitleChange(e.target.value);
              }}
              onInput={(e) => {
                e.stopPropagation();
                handleBoardTitleChange(e.target.value);
              }}
              onKeyDown={(e) => e.stopPropagation()}
              onFocus={(e) => e.target.select()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="kanban-board-title bg-transparent border-none focus:ring-0 p-0 w-full text-lg font-medium text-gray-900 dark:text-white"
              placeholder="Название доски"
            />
          </div>
          
          <div className="filters-container flex flex-col sm:flex-row gap-2 w-full md:w-auto md:justify-end md:ml-auto" style={{ justifyContent: 'flex-end' }}>
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск задач..."
                value={filterText}
                onChange={(e) => {
                  e.stopPropagation();
                  setFilterText(e.target.value);
                }}
                onInput={(e) => {
                  e.stopPropagation();
                  setFilterText(e.target.value);
                }}
                onFocus={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className="kanban-board-search text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 px-3 text-gray-900 dark:text-white w-full sm:w-48"
              />
              {filterText && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setFilterText('');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <select
              value={filterPriority || ''}
              onChange={(e) => {
                e.stopPropagation();
                setFilterPriority(e.target.value || null);
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 px-3 text-gray-900 dark:text-white"
            >
              <option value="">Все приоритеты</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
            <div className="flex gap-2 flex-wrap">
              <div className="stat-item text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 py-1 px-2 rounded">
                <span className="font-medium">Всего задач:</span> {stats.total}
              </div>
              <div className="stat-item text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 py-1 px-2 rounded">
                <span className="font-medium">Завершено:</span> {stats.completed}
              </div>
              <div className="stat-item text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 py-1 px-2 rounded">
                <span className="font-medium">В процессе:</span> {stats.inProgress}
              </div>
              <div className="stat-item text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 py-1 px-2 rounded">
                <span className="font-medium">Планируется:</span> {stats.planned}
              </div>
            </div>
            
            <div className="hidden sm:flex items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mr-2">Выполнено: {stats.completionPercentage}%</div>
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-500 h-full rounded-full" 
                  style={{ width: `${stats.completionPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {boardState.columnOrder?.map((columnId, index) => {
            const column = boardState.columns.find(c => c.id === columnId);
            if (!column) return null;

            // Фильтрованные карточки
            const cards = filteredCards(columnId, column.cardIds);
            // Первая колонка (Планируется)
            const isFirstColumn = index === 0;

            return (
              <DroppableColumn
                key={column.id}
                column={column}
                cards={cards}
                handleColumnTitleChange={handleColumnTitleChange}
                handleAddCard={handleAddCard}
                handleDeleteCard={handleDeleteCard}
                handleCardTitleChange={handleCardTitleChange}
                handleCardDescriptionChange={handleCardDescriptionChange}
                handleCardPriorityChange={handleCardPriorityChange}
                handleDragStart={handleDragStart}
                handleDrop={handleDrop}
                isFirstColumn={isFirstColumn}
              />
            );
          })}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default KanbanBoardComponent; 