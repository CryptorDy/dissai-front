import React, { useState, useCallback, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import ReactDOM from 'react-dom';

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
  // Состояние для модального окна подтверждения удаления
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState(null);

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

  // Функция установки столбца как завершающего для процента выполнения
  const handleSetAsCompletedColumn = (columnId) => {
    if (!boardState || !boardState.columns) return;
    
    setBoardState(prevState => {
      if (!prevState || !prevState.columns) return prevState;
      
      // Создаем новые колонки с обновленной меткой завершения
      const updatedColumns = prevState.columns.map(col => ({
        ...col,
        isCompletedColumn: col.id === columnId
      }));
      
      // Обновляем состояние доски
      const updatedState = {
        ...prevState,
        columns: updatedColumns
      };
      
      // Сохраняем состояние
      saveStateToTiptap(updatedState);
      
      return updatedState;
    });
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
    
    // Находим колонку с меткой isCompletedColumn или используем 'col-3' по умолчанию
    const completedColumn = boardState.columns.find(col => col.isCompletedColumn) || 
                          boardState.columns.find(col => col.id === 'col-3');
    
    const completed = completedColumn?.cardIds?.length || 0;
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

  // Функция добавления новой колонки
  const handleAddColumn = () => {
    if (!boardState || !boardState.columns || !boardState.columnOrder) return;
    
    // Генерируем уникальный ID для новой колонки
    const newColumnId = `col-${generateId()}`;
    
    setBoardState(prevState => {
      if (!prevState || !prevState.columns || !prevState.columnOrder) return prevState;
      
      // Создаем новую колонку
      const newColumn = {
        id: newColumnId,
        title: 'Новая колонка',
        cardIds: []
      };
      
      // Обновляем состояние доски
      const updatedState = {
        ...prevState,
        columns: [...prevState.columns, newColumn],
        columnOrder: [...prevState.columnOrder, newColumnId]
      };
      
      // Сохраняем состояние
      saveStateToTiptap(updatedState);
      
      return updatedState;
    });
  };
  
  // Функция удаления колонки
  const handleDeleteColumn = (columnId) => {
    if (!boardState || !boardState.columns || !boardState.columnOrder) return;
    
    // Нельзя удалить последнюю колонку
    if (boardState.columnOrder.length <= 1) return;
    
    setBoardState(prevState => {
      if (!prevState || !prevState.columns || !prevState.columnOrder) return prevState;
      
      // Находим колонку для удаления
      const column = prevState.columns.find(col => col.id === columnId);
      if (!column) return prevState;
      
      // Массив ID карточек, которые нужно удалить
      const cardIdsToRemove = column.cardIds || [];
      
      // Создаем новые объекты для обновленного состояния
      const newColumns = prevState.columns.filter(col => col.id !== columnId);
      const newColumnOrder = prevState.columnOrder.filter(id => id !== columnId);
      
      // Создаем копию карточек и удаляем карточки из удаляемой колонки
      const newCards = { ...prevState.cards };
      cardIdsToRemove.forEach(cardId => {
        delete newCards[cardId];
      });
      
      // Обновляем состояние доски
      const updatedState = {
        ...prevState,
        columns: newColumns,
        columnOrder: newColumnOrder,
        cards: newCards
      };
      
      // Сохраняем состояние
      saveStateToTiptap(updatedState);
      
      return updatedState;
    });
    
    // Сбрасываем состояние удаления столбца
    setColumnToDelete(null);
    setDeleteModalVisible(false);
  };

  // Функция для запроса подтверждения удаления столбца
  const confirmDeleteColumn = (columnId) => {
    // Находим колонку для отображения названия в модальном окне
    const column = boardState?.columns?.find(col => col.id === columnId);
    if (column) {
      setColumnToDelete(column);
      setDeleteModalVisible(true);
    }
  };

  // Функция подтверждения удаления столбца из модального окна
  const handleConfirmDeleteColumn = () => {
    if (columnToDelete) {
      handleDeleteColumn(columnToDelete.id);
    }
    setDeleteModalVisible(false);
    setColumnToDelete(null);
  };

  // Функция отмены удаления столбца
  const cancelDeleteColumn = () => {
    setDeleteModalVisible(false);
    setColumnToDelete(null);
  };

  return (
    <>
      <NodeViewWrapper 
        className="relative" 
        data-kanban-board="true"
        onClick={(e) => {
          // Проверяем, существует ли текущий editor
          if (editor && editor.isActive) {
            // Предотвращаем выделение
            editor.commands.blur();
          }
          
          // Блокируем клик внутри канбан-доски 
          e.stopPropagation();
        }}
      >
        {/* Добавляем обертку с предотвращением событий */}
        <div 
          contentEditable={false}
          className="kanban-board not-prose shadow-sm my-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
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
          
          <div className="kanban-columns-container overflow-x-auto pb-2">
            <div className="inline-flex gap-4 p-4 w-max min-w-full">
              {boardState?.columnOrder?.map((columnId, index) => {
                const column = boardState?.columns?.find(c => c.id === columnId);
                if (!column) return null;

                // Фильтрованные карточки
                const cards = filteredCards(columnId, column.cardIds);
                // Первая колонка (Планируется)
                const isFirstColumn = index === 0;
                // Проверяем, является ли эта колонка завершающей
                const isCompletedColumn = column.isCompletedColumn || false;

                return (
                  <div
                    key={column.id}
                    className="kanban-column bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 min-w-[250px] flex-shrink-0 w-[300px]"
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
                    <div className="kanban-column-header flex items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <input
                        type="text"
                        value={column.title}
                        onChange={(e) => handleColumnTitleChange(column.id, e.target.value)}
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent border-none p-0 focus:ring-0 mr-auto"
                        onMouseDown={e => e.stopPropagation()}
                        onKeyDown={e => e.stopPropagation()}
                      />
                      <div className="flex items-center">
                        {/* Кнопка отметки колонки как завершающей с новой иконкой */}
                        <button
                          className={`flex items-center justify-center transition-colors mx-1 rounded ${isCompletedColumn ? 
                            'text-green-500 hover:text-green-600 bg-green-50 dark:bg-green-900/20' : 
                            'text-gray-400 hover:text-green-500'}`}
                          onClick={() => handleSetAsCompletedColumn(column.id)}
                          onMouseDown={e => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          title={isCompletedColumn ? "Эта колонка используется для расчета % завершения" : "Отметить как колонку завершения"}
                          style={{ width: '24px', height: '24px' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-17l6 4 6-4 6 4v12l-6-4-6 4" />
                          </svg>
                        </button>
                        
                        <button
                          className="flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors mx-1 w-6 h-6"
                          onClick={() => handleAddCard(column.id)}
                          onMouseDown={e => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          title="Добавить задачу"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        
                        {/* Кнопка удаления колонки (если это не единственная колонка) */}
                        {boardState?.columnOrder?.length > 1 && (
                          <button
                            className="flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors mx-1 w-6 h-6"
                            onClick={() => confirmDeleteColumn(column.id)}
                            onMouseDown={e => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            title="Удалить колонку"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full ml-2">
                          {cards.length}
                        </span>
                      </div>
                    </div>

                    <div className="min-h-[100px] kanban-cards-container pt-2">
                      {cards.map((card, index) => (
                        <DraggableCard
                          key={card.id}
                          card={card}
                          columnId={column.id}
                          handleDeleteCard={handleDeleteCard}
                          handleCardTitleChange={handleCardTitleChange}
                          handleCardDescriptionChange={handleCardDescriptionChange}
                          handleCardPriorityChange={handleCardPriorityChange}
                          handleDeadlineChange={handleDeadlineChange}
                          handleDragStart={handleDragStart}
                          isLastCard={index === cards.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Кнопка добавления новой колонки */}
              <div className="flex items-center justify-center">
                <button
                  className="flex items-center justify-center text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 rounded-lg transition-colors border border-dashed border-blue-300 dark:border-blue-700 w-12 h-24 mx-2"
                  onClick={() => handleAddColumn()}
                  onMouseDown={e => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  title="Добавить колонку"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </NodeViewWrapper>

      {/* Модальное окно через портал для корректного отображения поверх остального контента */}
      {deleteModalVisible && columnToDelete && ReactDOM.createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-in-out'
          }}
          onMouseDown={e => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
            style={{ animation: 'slideIn 0.3s ease-out' }}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Удаление столбца</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Вы уверены, что хотите удалить столбец "{columnToDelete.title}"? 
              Все задачи внутри этого столбца будут также удалены.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
                onClick={cancelDeleteColumn}
                onMouseDown={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                Отмена
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                onClick={handleConfirmDeleteColumn}
                onMouseDown={e => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// Добавляем стили для анимации
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Медиа-запрос для мобильных устройств */
@media (max-width: 640px) {
  .fixed.inset-0.z-\\[9999\\] {
    padding: 12px !important;
  }
  .fixed.inset-0.z-\\[9999\\] > div {
    width: calc(100% - 20px) !important;
    max-width: 100% !important;
  }
}
`;
document.head.appendChild(style);

export default KanbanBoardComponent; 