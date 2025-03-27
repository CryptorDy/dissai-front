import React, { useState, useCallback, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';

// Стили компонента
import './KanbanBoardComponent.css';

// Типы для состояния доски
interface Card {
  id: string;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
}

interface Column {
  id: string;
  title: string;
  cardIds: string[];
}

interface BoardState {
  columns: Column[];
  cards: { [key: string]: Card };
  columnOrder: string[];
}

// Вспомогательная функция для генерации ID
const generateId = (): string => `id-${Math.random().toString(36).substr(2, 9)}`;

// Основной компонент канбан-доски
const KanbanBoardComponent: React.FC<NodeViewProps> = (props) => {
  const { node, updateAttributes, editor } = props;
  
  // Инициализируем состояние из атрибутов ноды Tiptap
  let parsedBoardState: BoardState | null = null;

  // Проверяем формат boardState и преобразуем из JSON, если это строка
  try {
    if (typeof node.attrs.boardState === 'string') {
      // Если это строка, пытаемся распарсить JSON
      parsedBoardState = JSON.parse(node.attrs.boardState);
    } else if (node.attrs.boardState) {
      // Если это уже объект, используем его напрямую
      parsedBoardState = node.attrs.boardState;
    }
  } catch (error) {
    console.error("Ошибка при парсинге boardState:", error);
  }

  // Используем проверенное состояние или стандартное
  const initialBoardState: BoardState = parsedBoardState || {
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
  };

  const [boardState, setBoardState] = useState<BoardState>(initialBoardState);
  const [filterText, setFilterText] = useState('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);

  // Отслеживаем изменения в свойствах node, чтобы обновить состояние при смене файла
  useEffect(() => {
    try {
      let newBoardState: BoardState | null = null;
      
      if (typeof node.attrs.boardState === 'string') {
        newBoardState = JSON.parse(node.attrs.boardState);
      } else if (node.attrs.boardState) {
        newBoardState = node.attrs.boardState;
      }
      
      if (newBoardState) {
        setBoardState(newBoardState);
      }
    } catch (error) {
      console.error('Ошибка при обновлении состояния доски из props:', error);
    }
  }, [node.attrs.boardState]);

  // Обработчики событий

  // Изменение заголовка карточки
  const handleCardTitleChange = (cardId: string, newTitle: string) => {
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
  };

  // Изменение описания карточки
  const handleCardDescriptionChange = (cardId: string, newDescription: string) => {
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
  };

  // Изменение приоритета карточки
  const handleCardPriorityChange = (cardId: string, newPriority: 'low' | 'medium' | 'high' | undefined) => {
    const newState = {
      ...boardState,
      cards: {
        ...boardState.cards,
        [cardId]: {
          ...boardState.cards[cardId],
          priority: newPriority,
        },
      },
    };
    setBoardState(newState);
  };

  // Изменение заголовка колонки
  const handleColumnTitleChange = (columnId: string, newTitle: string) => {
    const newState = {
      ...boardState,
      columns: boardState.columns.map(col => 
        col.id === columnId ? { ...col, title: newTitle } : col
      )
    };
    setBoardState(newState);
  };

  // Добавление новой карточки
  const handleAddCard = (columnId: string) => {
    const newCardId = `card-${generateId()}`;
    const newCard: Card = {
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
  };

  // Удаление карточки
  const handleDeleteCard = (columnId: string, cardId: string) => {
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
  };

  // Фильтрация карточек
  const filteredCards = (columnId: string, cardIds: string[]) => {
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

  // Рендеринг компонента
  return (
    <NodeViewWrapper 
      className="interactive-kanban-wrapper p-1 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg"
      data-drag-handle
      onClick={(e: React.MouseEvent) => {
        // Предотвращаем случайное внесение изменений в контент редактора при клике
        e.stopPropagation();
      }}
      onDoubleClick={(e: React.MouseEvent) => {
        // Предотвращаем двойной клик для стандартного редактирования
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <div contentEditable={false} className="kanban-board-react-content not-prose">
        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 md:mb-0">
              Название доски
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск задач..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 px-3 text-gray-900 dark:text-white w-full sm:w-48"
              />
              {filterText && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setFilterText('')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <select
              value={filterPriority || ''}
              onChange={(e) => setFilterPriority(e.target.value || null)}
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
          {boardState.columnOrder?.map((columnId) => {
            const column = boardState.columns.find(c => c.id === columnId);
            if (!column) return null;

            // Фильтрованные карточки
            const cards = filteredCards(columnId, column.cardIds);

            return (
              <div
                key={column.id}
                className="kanban-column bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
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

                <div className="space-y-2 min-h-[100px]">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className={`kanban-card p-3 rounded-md shadow-sm hover:shadow-md relative group border ${
                        card.priority === 'high' 
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                          : card.priority === 'medium'
                            ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                            : card.priority === 'low'
                              ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                              : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-700'
                      }`}
                      onMouseDown={e => e.stopPropagation()}
                      style={{ 
                        borderLeftWidth: '4px',
                        borderLeftColor: card.priority === 'high' ? '#f87171' : card.priority === 'medium' ? '#fbbf24' : card.priority === 'low' ? '#60a5fa' : '#e5e7eb'
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
                          onClick={() => handleDeleteCard(column.id, card.id)}
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
                        rows={2}
                        onKeyDown={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        placeholder="Введите описание задачи"
                      />
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                        <select
                          value={card.priority || 'none'}
                          onChange={(e) => handleCardPriorityChange(card.id, e.target.value === 'none' ? undefined : e.target.value as any)}
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
                  ))}
                </div>

                <button
                  className="mt-4 text-sm text-white bg-blue-500 hover:bg-blue-600 py-1 px-3 rounded-md w-full transition-colors"
                  onClick={() => handleAddCard(column.id)}
                  onMouseDown={e => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  + Добавить карточку
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default KanbanBoardComponent; 