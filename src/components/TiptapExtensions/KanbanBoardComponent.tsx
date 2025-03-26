import React, { useState, useCallback, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';

// Для полноценной реализации drag-and-drop можно подключить библиотеку
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Стили компонента
import './KanbanBoardComponent.css';

// Типы для состояния доски
interface Card {
  id: string;
  title: string;
  description: string;
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

const KanbanBoardComponent: React.FC<NodeViewProps> = (props) => {
  const { node, updateAttributes, editor } = props;

  // Логирование для отладки
  console.log("KanbanBoardComponent рендер, attrs:", node.attrs);
  
  // Инициализируем состояние из атрибутов ноды Tiptap
  let parsedBoardState: BoardState | null = null;

  // Проверяем формат boardState и преобразуем из JSON, если это строка
  try {
    if (typeof node.attrs.boardState === 'string') {
      // Если это строка, пытаемся распарсить JSON
      parsedBoardState = JSON.parse(node.attrs.boardState);
      console.log("Распарсен boardState из строки:", parsedBoardState);
    } else if (node.attrs.boardState) {
      // Если это уже объект, используем его напрямую
      parsedBoardState = node.attrs.boardState;
      console.log("Получен boardState как объект:", parsedBoardState);
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
      'card-1': { id: 'card-1', title: 'Задача 1', description: 'Описание задачи 1' },
      'card-2': { id: 'card-2', title: 'Задача 2', description: 'Описание задачи 2' },
      'card-3': { id: 'card-3', title: 'Задача 3', description: 'Описание задачи 3' },
    },
    columnOrder: ['col-1', 'col-2', 'col-3'],
  };

  const [boardState, setBoardState] = useState<BoardState>(initialBoardState);

  // Функция для сохранения состояния в TipTap
  const saveStateToTiptap = useCallback((newState: BoardState) => {
    if (!editor.isEditable) return;
    
    try {
      // Делаем глубокую копию объекта, чтобы избежать проблем с реактивностью
      const stateCopy = JSON.parse(JSON.stringify(newState));
      
      // Для отладки
      console.log('Сохранение состояния канбан-доски:', JSON.stringify(stateCopy).slice(0, 50) + '...');
      
      // Обновляем атрибуты ноды
      // Если updateAttributes ожидает строку, преобразуем объект в строку
      updateAttributes({
        boardState: stateCopy
      });
      
      // Отмечаем, что редактор изменился
      // Это важно для запуска обработчика onUpdate в RichTextEditor
      const tr = editor.view.state.tr;
      editor.view.dispatch(tr);
    } catch (error) {
      console.error('Ошибка при сохранении состояния канбан-доски:', error);
    }
  }, [updateAttributes, editor.isEditable, editor.view]);

  // Отслеживаем изменения в свойствах node, чтобы обновить состояние при смене файла
  useEffect(() => {
    // Проверяем, изменился ли boardState в props
    try {
      let newBoardState: BoardState | null = null;
      
      if (typeof node.attrs.boardState === 'string') {
        newBoardState = JSON.parse(node.attrs.boardState);
      } else if (node.attrs.boardState) {
        newBoardState = node.attrs.boardState;
      }
      
      if (newBoardState) {
        console.log('Обновление boardState из props:', newBoardState);
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
    saveStateToTiptap(newState);
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
    saveStateToTiptap(newState);
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
    saveStateToTiptap(newState);
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
    saveStateToTiptap(newState);
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
    saveStateToTiptap(newState);
  };

  // Обработчик перетаскивания (для react-beautiful-dnd)
  const onDragEnd = (result: {destination?: {droppableId: string, index: number}, source: {droppableId: string, index: number}, draggableId: string}) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Исходная колонка
    const startColumn = boardState.columns.find(c => c.id === source.droppableId);
    // Целевая колонка
    const finishColumn = boardState.columns.find(c => c.id === destination.droppableId);

    if (!startColumn || !finishColumn) return;

    // Перемещение в той же колонке
    if (startColumn.id === finishColumn.id) {
      const newCardIds = Array.from(startColumn.cardIds);
      newCardIds.splice(source.index, 1);
      newCardIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        cardIds: newCardIds,
      };

      const newState = {
        ...boardState,
        columns: boardState.columns.map(c => 
          c.id === newColumn.id ? newColumn : c
        ),
      };

      setBoardState(newState);
      saveStateToTiptap(newState);
      return;
    }

    // Перемещение между колонками
    const startCardIds = Array.from(startColumn.cardIds);
    startCardIds.splice(source.index, 1);
    const newStartColumn = {
      ...startColumn,
      cardIds: startCardIds,
    };

    const finishCardIds = Array.from(finishColumn.cardIds);
    finishCardIds.splice(destination.index, 0, draggableId);
    const newFinishColumn = {
      ...finishColumn,
      cardIds: finishCardIds,
    };

    const newState = {
      ...boardState,
      columns: boardState.columns.map(c => {
        if (c.id === newStartColumn.id) return newStartColumn;
        if (c.id === newFinishColumn.id) return newFinishColumn;
        return c;
      }),
    };

    setBoardState(newState);
    saveStateToTiptap(newState);
  };

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
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 p-4">
          Канбан-доска проекта
        </h3>

        {/* Для полноценного drag-and-drop можно обернуть в DragDropContext */}
        {/* <DragDropContext onDragEnd={onDragEnd}> */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {boardState.columnOrder?.map((columnId) => {
              const column = boardState.columns.find(c => c.id === columnId);
              if (!column) return null;

              const cards = column.cardIds
                .map(cardId => boardState.cards[cardId])
                .filter(Boolean);

              return (
                // <Droppable key={column.id} droppableId={column.id}>
                //   {(provided) => (
                    <div
                      key={column.id}
                      className="kanban-column bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                      // ref={provided.innerRef}
                      // {...provided.droppableProps}
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

                      <div className="space-y-2">
                        {cards.map((card, index) => (
                          // <Draggable key={card.id} draggableId={card.id} index={index}>
                          //   {(providedCard) => (
                              <div
                                key={card.id}
                                className="kanban-card bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow relative group"
                                // ref={providedCard.innerRef}
                                // {...providedCard.draggableProps}
                                // {...providedCard.dragHandleProps}
                                onMouseDown={e => e.stopPropagation()}
                              >
                                <div className="flex justify-between items-start">
                                  <input
                                    type="text"
                                    value={card.title}
                                    onChange={(e) => handleCardTitleChange(card.id, e.target.value)}
                                    className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1 w-full bg-transparent border-none p-0 focus:ring-0"
                                    onKeyDown={e => e.stopPropagation()}
                                    onMouseDown={e => e.stopPropagation()}
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
                                />
                              </div>
                          //   )}
                          // </Draggable>
                        ))}
                        {/* {provided.placeholder} */}
                      </div>

                      <button
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline w-full text-left"
                        onClick={() => handleAddCard(column.id)}
                        onMouseDown={e => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                      >
                        + Добавить карточку
                      </button>
                    </div>
                //   )}
                // </Droppable>
              );
            })}
          </div>
        {/* </DragDropContext> */}
      </div>
    </NodeViewWrapper>
  );
};

export default KanbanBoardComponent; 