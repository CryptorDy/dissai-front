import React, { useState, useCallback, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

// Удалено использование react-dnd
// import { useDrag, useDrop } from 'react-dnd';

// Стили компонента
import './KanbanBoardComponent.css';

// Импортируем выделенные компоненты
import DraggableCard from './DraggableCard';
import DroppableColumn from './DroppableColumn';

// Вспомогательная функция для генерации ID
const generateId = () => `id-${Math.random().toString(36).substr(2, 9)}`;

const KanbanBoardComponent = (props) => {
  const { node, updateAttributes, editor } = props;
  
  // Состояние для drag and drop
  const [draggedCardId, setDraggedCardId] = useState(null);
  const [draggedFromColumnId, setDraggedFromColumnId] = useState(null);

  // Защита от проблем с рендерингом при нескольких экземплярах
  const instanceId = React.useMemo(() => `kanban-${generateId()}`, []);
  
  // Референс для таймаута сохранения
  const saveTimeoutRef = React.useRef(null);

  // Инициализируем состояние из атрибутов ноды Tiptap
  const defaultBoardState = {
    columns: [
      { id: 'col-1', title: 'Планируется', cardIds: ['card-1', 'card-2'] },
      { id: 'col-2', title: 'В процессе', cardIds: ['card-3'] },
      { id: 'col-3', title: 'Завершено', cardIds: [] },
    ],
    cards: {
      'card-1': { id: 'card-1', title: 'Задача 1', description: 'Описание задачи 1', priority: 'medium', deadline: '' },
      'card-2': { id: 'card-2', title: 'Задача 2', description: 'Описание задачи 2', priority: 'low', deadline: '' },
      'card-3': { id: 'card-3', title: 'Задача 3', description: 'Описание задачи 3', priority: 'high', deadline: '' },
    },
    columnOrder: ['col-1', 'col-2', 'col-3'],
    boardTitle: 'Название доски',
  };

  // Проверка существования и корректности данных из ноды
  const initialBoardState = (() => {
    try {
      // Проверяем, что node и node.attrs существуют
      if (!node || !node.attrs || !node.attrs.boardState) {
        return defaultBoardState;
      }
      
      // Получаем данные из атрибутов
      const data = node.attrs.boardState;
      
      // Проверяем, есть ли вложенный объект boardState
      const boardData = data.boardState || data;
      
      // Проверяем, что структура данных полная
      const hasRequiredProperties = 
        boardData.columns && 
        boardData.cards && 
        boardData.columnOrder && 
        typeof boardData.boardTitle === 'string';
        
      if (!hasRequiredProperties) {
        console.warn(`[${instanceId}] Неполные данные в boardState:`, boardData);
        return defaultBoardState;
      }
      
      return boardData;
    } catch (error) {
      console.error(`[${instanceId}] Ошибка при инициализации состояния канбан-доски:`, error);
      return defaultBoardState;
    }
  })();

  const [boardState, setBoardState] = useState(initialBoardState);
  const [filterText, setFilterText] = useState('');
  const [filterPriority, setFilterPriority] = useState(null);
  const [filterDeadline, setFilterDeadline] = useState(null);

  // Используем useLayoutEffect для предотвращения flushSync warning
  React.useLayoutEffect(() => {
    if (!node?.attrs?.boardState) return;
    
    try {
      // Мемоизируем данные для предотвращения лишних ре-рендеров
      const data = JSON.parse(JSON.stringify(node.attrs.boardState));
      
      // Проверяем, есть ли вложенный объект boardState
      const boardData = data.boardState || data;
      
      // Проверяем, что данные действительно изменились
      if (boardData && boardData.columns && boardData.cards && boardData.columnOrder) {
        // Удаляем служебные поля для сравнения
        const { _lastSaved, _recoveryTimestamp, ...dataToCompare } = boardData;
        const { _lastSaved: currentLastSaved, _recoveryTimestamp: currentRecoveryTimestamp, ...currentToCompare } = boardState;
        
        // Сравниваем только значимые данные
        const dataString = JSON.stringify(dataToCompare);
        const currentString = JSON.stringify(currentToCompare);

        // Обновляем состояние только если данные действительно изменились
        if (dataString !== currentString) {
          console.log(`[${instanceId}] Обновление состояния из атрибутов:`, {
            dataString,
            currentString
          });
          setBoardState(boardData);
        }
      }
    } catch (error) {
      console.error(`[${instanceId}] Ошибка при обработке данных:`, error);
    }
  }, [node?.attrs?.boardState, instanceId]);

  // Функция сохранения состояния канбана в Tiptap
  const saveStateToTiptap = useCallback((currentState) => {
    if (!updateAttributes || typeof updateAttributes !== 'function') {
      console.error('Ошибка: функция updateAttributes недоступна');
      return;
    }

    // Добавляем таймштамп последнего сохранения для отслеживания
    const stateToSave = {
      ...currentState,
      _lastSaved: Date.now()
    };

    // Проверяем, действительно ли состояние изменилось
    const { _lastSaved: currentLastSaved, _recoveryTimestamp: currentRecoveryTimestamp, ...currentToCompare } = currentState;
    const { _lastSaved: savedLastSaved, _recoveryTimestamp: savedRecoveryTimestamp, ...savedToCompare } = node?.attrs?.boardState || {};

    // Сравниваем только значимые данные
    const currentString = JSON.stringify(currentToCompare);
    const savedString = JSON.stringify(savedToCompare);

    if (currentString === savedString) {
      console.log(`[${instanceId}] Состояние не изменилось, пропускаем сохранение`);
      return;
    }

    // Логирование
    console.log(`[${instanceId}] Сохранение состояния канбана:`, {
      columnsCount: stateToSave.columns.length,
      cardsCount: Object.keys(stateToSave.cards).length,
      currentState: currentString,
      savedState: savedString
    });

    try {
      // Сохраняем состояние в атрибутах ноды Tiptap без requestAnimationFrame
      updateAttributes({
        boardState: stateToSave
      });
    } catch (error) {
      console.error(`[${instanceId}] Ошибка при сохранении состояния канбана:`, error);
    }
  }, [updateAttributes, instanceId, node?.attrs?.boardState]);

  // Функция отложенного сохранения с дебаунсом
  const debouncedSaveState = useCallback((state) => {
    // Проверяем, действительно ли состояние изменилось
    const { _lastSaved: currentLastSaved, _recoveryTimestamp: currentRecoveryTimestamp, ...currentToCompare } = state;
    const { _lastSaved: savedLastSaved, _recoveryTimestamp: savedRecoveryTimestamp, ...savedToCompare } = node?.attrs?.boardState || {};

    // Сравниваем только значимые данные
    const currentString = JSON.stringify(currentToCompare);
    const savedString = JSON.stringify(savedToCompare);

    if (currentString === savedString) {
      console.log(`[${instanceId}] Состояние не изменилось, пропускаем отложенное сохранение`);
      return;
    }

    // Отменяем предыдущий таймаут, если он существует
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Устанавливаем новый таймаут для отложенного сохранения
    saveTimeoutRef.current = setTimeout(() => {
      saveStateToTiptap(state);
      saveTimeoutRef.current = null;
    }, 500); // Дебаунс 500 мс
  }, [saveStateToTiptap, node?.attrs?.boardState, instanceId]);

  // Эффект для отслеживания изменений состояния и его сохранения
  useEffect(() => {
    // Проверяем, что состояние инициализировано
    if (boardState && boardState.columns && boardState.cards) {
      // Проверяем, действительно ли состояние изменилось
      const { _lastSaved: currentLastSaved, _recoveryTimestamp: currentRecoveryTimestamp, ...currentToCompare } = boardState;
      const { _lastSaved: savedLastSaved, _recoveryTimestamp: savedRecoveryTimestamp, ...savedToCompare } = node?.attrs?.boardState || {};

      // Сравниваем только значимые данные
      const currentString = JSON.stringify(currentToCompare);
      const savedString = JSON.stringify(savedToCompare);

      if (currentString !== savedString) {
        // Сохраняем состояние с дебаунсом только если оно действительно изменилось
        debouncedSaveState(boardState);
      } else {
        console.log(`[${instanceId}] Состояние не изменилось, пропускаем автосохранение`);
      }
    }
  }, [boardState, debouncedSaveState, node?.attrs?.boardState, instanceId]);

  // Функция сохранения при потере фокуса - немедленное сохранение
  const handleTitleBlur = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // Немедленно сохраняем состояние
    saveStateToTiptap(boardState);
  };

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
    if (!boardState || !boardState.cards || !boardState.cards[cardId]) return;
    
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
    
    // Сначала обновляем локальное состояние, затем отправляем в Tiptap
    setBoardState(prevState => {
      // Дополнительная проверка, чтобы убедиться, что состояние не изменилось с момента вызова
      if (!prevState || !prevState.cards || !prevState.cards[cardId]) return prevState;
      
      const updatedState = {
        ...prevState,
        cards: {
          ...prevState.cards,
          [cardId]: {
            ...prevState.cards[cardId],
            title: newTitle,
          },
        },
      };
      
      // Немедленно сохраняем важные изменения
      saveStateToTiptap(updatedState);
      
      return updatedState;
    });
  };

  // Изменение описания карточки
  const handleCardDescriptionChange = (cardId, newDescription) => {
    if (!boardState || !boardState.cards || !boardState.cards[cardId]) return;
    
    setBoardState(prevState => {
      if (!prevState || !prevState.cards || !prevState.cards[cardId]) return prevState;
      
      const updatedState = {
        ...prevState,
        cards: {
          ...prevState.cards,
          [cardId]: {
            ...prevState.cards[cardId],
            description: newDescription,
          },
        },
      };
      
      // Немедленно сохраняем важные изменения
      saveStateToTiptap(updatedState);
      
      return updatedState;
    });
  };

  // Изменение приоритета карточки
  const handleCardPriorityChange = (cardId, newPriority) => {
    if (!boardState || !boardState.cards || !boardState.cards[cardId]) return;
    
    setBoardState(prevState => {
      if (!prevState || !prevState.cards || !prevState.cards[cardId]) return prevState;
      
      const updatedState = {
        ...prevState,
        cards: {
          ...prevState.cards,
          [cardId]: {
            ...prevState.cards[cardId],
            priority: newPriority === 'none' ? undefined : newPriority,
          },
        },
      };
      
      // Немедленно сохраняем важные изменения
      saveStateToTiptap(updatedState);
      
      return updatedState;
    });
  };

  // Изменение заголовка колонки
  const handleColumnTitleChange = (columnId, newTitle) => {
    if (!boardState || !boardState.columns) return;
    
    setBoardState(prevState => {
      if (!prevState || !prevState.columns) return prevState;
      
      const updatedState = {
        ...prevState,
        columns: prevState.columns.map(col => 
        col.id === columnId ? { ...col, title: newTitle } : col
      )
    };
      
      // Сохраняем с дебаунсом после обновления состояния
      saveStateToTiptap(updatedState);
      
      return updatedState;
    });
  };

  // Добавление новой карточки
  const handleAddCard = (columnId) => {
    if (!boardState || !boardState.columns || !boardState.cards) return;
    
    const newCardId = `card-${generateId()}`;
    const newCard = {
      id: newCardId,
      title: 'Новая задача',
      description: 'Описание задачи',
      priority: 'medium',
      deadline: ''
    };
    
    setBoardState(prevState => {
      if (!prevState || !prevState.columns || !prevState.cards) return prevState;
      
      const updatedState = {
        ...prevState,
      cards: {
          ...prevState.cards,
        [newCardId]: newCard,
      },
        columns: prevState.columns.map(col =>
        col.id === columnId
            ? { ...col, cardIds: [...(col.cardIds || []), newCardId] }
          : col
      ),
    };
      
      // Сохраняем с дебаунсом после обновления состояния
      saveStateToTiptap(updatedState);
      
      return updatedState;
    });
  };

  // Удаление карточки
  const handleDeleteCard = (columnId, cardId) => {
    if (!boardState || !boardState.columns || !boardState.cards) return;
    
    setBoardState(prevState => {
      if (!prevState || !prevState.columns || !prevState.cards) return prevState;
      
      const newColumns = prevState.columns.map(col =>
      col.id === columnId
          ? { ...col, cardIds: (col.cardIds || []).filter(id => id !== cardId) }
        : col
    );
    
      const newCards = { ...prevState.cards };
    delete newCards[cardId];
      
      const updatedState = {
        ...prevState,
        cards: newCards,
        columns: newColumns,
      };
      
      // Сохраняем с дебаунсом после обновления состояния
      saveStateToTiptap(updatedState);
      
      return updatedState;
    });
  };

  // Перемещение карточки между колонками
  const moveCard = (cardId, sourceColumnId, destinationColumnId) => {
    if (!boardState || !boardState.columns || !boardState.cards) return;
    
    setBoardState(prevState => {
      if (!prevState || !prevState.columns || !prevState.cards) return prevState;
      
      // Получаем исходную и целевую колонки
      const sourceColumn = prevState.columns.find(col => col.id === sourceColumnId);
      const destinationColumn = prevState.columns.find(col => col.id === destinationColumnId);
      
      if (!sourceColumn || !destinationColumn) return prevState;

      // Создаем новые массивы ID карточек для обеих колонок
      const sourceCardIds = [...(sourceColumn.cardIds || [])].filter(id => id !== cardId);
      const destinationCardIds = [...(destinationColumn.cardIds || [])];
      
      // Добавляем ID карточки в целевую колонку
      destinationCardIds.push(cardId);
      
      // Обновляем состояние
      const updatedState = {
        ...prevState,
        columns: prevState.columns.map(col => {
          if (col.id === sourceColumnId) {
            return { ...col, cardIds: sourceCardIds };
          }
          if (col.id === destinationColumnId) {
            return { ...col, cardIds: destinationCardIds };
          }
          return col;
        }),
      };
      
      // Сохраняем немедленно без дебаунса, так как это важная операция
      saveStateToTiptap(updatedState);
      
      return updatedState;
    });
  };

  // Изменение заголовка доски
  const handleBoardTitleChange = (newTitle) => {
    if (!boardState) return; // Защита от null/undefined
    
    // Проверяем, что newTitle не undefined и не null
    const title = newTitle || "Канбан-доска";
    
    console.log("Устанавливаем новое название:", title);
    
    // Немедленно обновляем состояние и сохраняем его
    const updatedState = {
      ...boardState,
      boardTitle: title
    };
    
    // Немедленно устанавливаем новое состояние
    setBoardState(updatedState);
    
    // Отменяем ранее запланированное сохранение
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Сохраняем с дебаунсом
    debouncedSaveState(updatedState);
  };
  
  // Очистка таймаута при размонтировании
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Фильтрация карточек
  const filteredCards = (columnId, cardIds) => {
    if (!boardState || !boardState.cards) return [];
    
    // Проверяем, что cardIds существует и это массив
    const ids = Array.isArray(cardIds) ? cardIds : [];
    
    // Поскольку элементы фильтрации были удалены из UI,
    // возвращаем все карточки без фильтрации
    return ids.map(cardId => boardState.cards[cardId]).filter(card => card !== undefined);
  };

  // Статистика задач
  const calculateStats = () => {
    // Проверяем существование boardState и его свойств
    if (!boardState || !boardState.cards || !boardState.columns) {
      return { 
        total: 0, 
        completed: 0, 
        inProgress: 0, 
        planned: 0, 
        completionPercentage: 0,
        withDeadline: 0,
        expiredDeadline: 0
      };
    }
    
    const total = Object.keys(boardState.cards).length;
    const completed = boardState.columns.find(col => col.id === 'col-3')?.cardIds.length || 0;
    const inProgress = boardState.columns.find(col => col.id === 'col-2')?.cardIds.length || 0;
    const planned = boardState.columns.find(col => col.id === 'col-1')?.cardIds.length || 0;
    
    // Дополнительная статистика по дедлайнам
    let withDeadline = 0;
    let expiredDeadline = 0;
    const currentDate = new Date();

    Object.values(boardState.cards).forEach(card => {
      if (card.deadline && card.deadline.trim() !== '') {
        withDeadline++;
        const deadlineDate = new Date(card.deadline);
        if (deadlineDate < currentDate) {
          expiredDeadline++;
        }
      }
    });
    
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { 
      total, 
      completed, 
      inProgress, 
      planned, 
      completionPercentage,
      withDeadline,
      expiredDeadline
    };
  };

  // Безопасно вычисляем статистику
  const stats = calculateStats();

  // Обработчик изменения дедлайна карточки
  const handleDeadlineChange = (cardId, newDeadline) => {
    const logTimestamp = Date.now();
    
    if (!boardState || !boardState.cards || !boardState.cards[cardId]) {
      console.error(`[${logTimestamp}] Ошибка: невозможно изменить дедлайн - карточка не найдена`, cardId);
      return;
    }

    // Проверка: если дедлайн не изменился, то не делаем ничего
    if (boardState.cards[cardId].deadline === newDeadline) {
      return;
    }
    
    console.log(`[${logTimestamp}] Изменение дедлайна для ${cardId}:`, {
      старый: boardState.cards[cardId].deadline,
      новый: newDeadline
    });
    
    try {
      // Создаем новое состояние явно
      const updatedState = {
        ...boardState,
        cards: {
          ...boardState.cards,
          [cardId]: {
            ...boardState.cards[cardId],
            deadline: newDeadline || '',
          },
        }
      };
      
      // Обновляем локальное состояние
      setBoardState(updatedState);
      
      // Сохраняем с дебаунсом
      debouncedSaveState(updatedState);
    } catch (error) {
      console.error(`[${logTimestamp}] Критическая ошибка при сохранении дедлайна:`, error);
    }
  };

  // Добавляем эффект для проверки ошибок при вставке
  React.useEffect(() => {
    // Проверка, была ли канбан-доска только что вставлена
    const handleError = (error) => {
      // Если возникла ошибка, связанная с htmlBlock, пытаемся восстановить состояние канбан-доски
      if (error.message && (
          error.message.includes('Invalid content for node htmlBlock') || 
          error.message.includes('канбан') || 
          error.message.includes('kanban')
        )) {
        console.warn("Перехвачена ошибка вставки канбан-доски:", error);
        
        // Пытаемся восстановить состояние канбан-доски
        if (boardState) {
          setTimeout(() => {
            console.log("Восстановление состояния канбан-доски после ошибки...");
            
            try {
              // Проверяем наличие функции updateAttributes
              if (typeof updateAttributes === 'function') {
                updateAttributes({
                  boardState: {
      ...boardState,
                    _recoveryTimestamp: Date.now()
                  }
                });
                console.log("Состояние канбан-доски восстановлено");
              } else {
                console.error("updateAttributes не является функцией");
              }
            } catch (recoveryError) {
              console.error("Ошибка при восстановлении состояния:", recoveryError);
            }
          }, 50);
        }
      }
    };

    // Добавляем глобальный перехватчик ошибок
    window.addEventListener('error', handleError);
    
    // Создаем специальный идентификатор для этой канбан-доски
    const boardId = `kanban-${instanceId}`;
    
    // Добавляем маркер на DOM-элемент
    const domNode = document.querySelector(`[data-kanban-board="true"]`);
    if (domNode) {
      domNode.setAttribute('data-board-id', boardId);
    }
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [boardState, updateAttributes, instanceId]);

  // Рендеринг компонента
  return (
    <NodeViewWrapper 
      className="interactive-kanban-wrapper relative p-1 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg mb-4"
      contentEditable={false}
      data-kanban-board="true"
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        
        // Если клик произошел за нижней границей канбан-доски,
        // пропускаем его для создания нового параграфа
        if (e.clientY > rect.bottom) {
          // Не останавливаем распространение, позволяем редактору обработать клик
          return;
        }
        
        // Если клик произошел вне визуальных границ компонента слева/справа/сверху, не блокируем
        if (
          e.clientY < rect.top ||
          e.clientX > rect.right ||
          e.clientX < rect.left
        ) {
          return;
        }
        
        // Блокируем клик внутри канбан-доски 
        e.stopPropagation();
      }}
    >
      {/* Добавляем обертку с предотвращением событий */}
      <div 
        contentEditable={false}
        className="kanban-board-react-content not-prose"
        style={{ pointerEvents: 'auto', zIndex: 1 }}
        onClick={(e) => {
          // Проверяем, является ли клик нижней частью компонента
          const rect = e.currentTarget.getBoundingClientRect();
          if (e.clientY > rect.bottom - 20) {
            // Не предотвращаем события для нижней части
            return;
          }
          
                                      e.stopPropagation();
                                      e.preventDefault();
                                    }}
        onMouseDown={(e) => {
          // Проверяем, является ли клик нижней частью компонента
          const rect = e.currentTarget.getBoundingClientRect();
          if (e.clientY > rect.bottom - 20) {
            // Не предотвращаем события для нижней части
            return;
          }
          
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onDoubleClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                      >
        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="text-lg font-medium text-gray-900 dark:text-white mb-2 md:mb-0 w-full">
            <input
              type="text"
              value={boardState?.boardTitle || "Канбан-доска"}
              onChange={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const newTitle = e.target.value;
                console.log("Изменение названия:", newTitle);
                handleBoardTitleChange(newTitle);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                // Сохраняем при нажатии Enter
                if (e.key === 'Enter') {
                  console.log("Сохранение названия при Enter");
                  e.target.blur();
                  // Принудительно сохраняем текущее состояние
                  saveStateToTiptap(boardState);
                }
              }}
              onBlur={handleTitleBlur}
              className="kanban-board-title bg-transparent p-0 w-full text-lg font-bold text-gray-900 dark:text-white text-center"
              placeholder="Название доски"
            />
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
              {stats.withDeadline > 0 && (
                <div className="stat-item text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 py-1 px-2 rounded">
                  <span className="font-medium">С дедлайном:</span> {stats.withDeadline}
                </div>
              )}
              {stats.expiredDeadline > 0 && (
                <div className="stat-item text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 py-1 px-2 rounded">
                  <span className="font-medium">Просрочено:</span> {stats.expiredDeadline}
                </div>
              )}
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
          {boardState?.columnOrder?.map((columnId, index) => {
            const column = boardState?.columns?.find(c => c.id === columnId);
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
                handleDeadlineChange={handleDeadlineChange}
                handleDragStart={handleDragStart}
                handleDrop={handleDrop}
                isFirstColumn={isFirstColumn}
              />
            );
          }) || (
            <div className="col-span-3 text-center p-4 text-gray-500">
              Канбан-доска загружается...
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default KanbanBoardComponent; 