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
    boardTitle: 'Канбан-доска проекта',
  };

  // Проверка существования и корректности данных из ноды
  const initialBoardState = (() => {
    try {
      // Проверяем, что node и node.attrs существуют
      if (!node || !node.attrs || !node.attrs.boardState) {
        return defaultBoardState;
      }
      
      // Проверяем, что структура данных полная
      const data = node.attrs.boardState;
      const hasRequiredProperties = 
        data.columns && 
        data.cards && 
        data.columnOrder && 
        typeof data.boardTitle === 'string';
        
      if (!hasRequiredProperties) {
        return defaultBoardState;
      }
      
      return data;
    } catch (error) {
      console.error("Ошибка при инициализации состояния канбан-доски:", error);
      return defaultBoardState;
    }
  })();

  const [boardState, setBoardState] = useState(initialBoardState);
  const [filterText, setFilterText] = useState('');
  const [filterPriority, setFilterPriority] = useState(null);
  const [filterDeadline, setFilterDeadline] = useState(null);

  // Функция для сохранения состояния в TipTap
  const saveStateToTiptap = useCallback((newState) => {
    if (!editor || !editor.isEditable || !updateAttributes) {
      console.error("Не удалось сохранить состояние: editor или updateAttributes недоступны", {
        editorExists: !!editor,
        isEditable: editor?.isEditable,
        updateAttributesExists: !!updateAttributes
      });
      return false;
    }
    
    // Проверяем и глубоко клонируем состояние для предотвращения мутаций
    const safeState = JSON.parse(JSON.stringify(newState));
    
    // Дополнительная проверка на корректность структуры данных
    if (!safeState || !safeState.cards || !safeState.columns) {
      console.error("Некорректная структура данных для сохранения:", safeState);
      return false;
    }
    
    const timestamp = Date.now();
    console.log(`[${timestamp}] Сохраняем в Tiptap:`, {
      boardTitle: safeState.boardTitle,
      карточек: Object.keys(safeState.cards || {}).length,
      колонок: (safeState.columns || []).length,
      время: new Date().toLocaleTimeString()
    });
    
    try {
      // Используем только updateAttributes без любых транзакций редактора
      updateAttributes({
        boardState: {
          ...safeState,
          _lastUpdateTimestamp: timestamp
        },
      });
      
      // НЕ используем никаких вызовов редактора, которые могут вызвать транзакции
      // Это помогает избежать конфликтов при вставке канбан-доски
      
      console.log(`[${timestamp}] Атрибуты успешно обновлены в ${new Date().toLocaleTimeString()}`);
      return true;
    } catch (error) {
      console.error(`[${timestamp}] Ошибка при обновлении атрибутов:`, error);
      
      // Повторная попытка через небольшую паузу
      setTimeout(() => {
        try {
          console.log(`[${timestamp}] Повторная попытка сохранения...`);
          updateAttributes({
            boardState: {
              ...safeState,
              _lastUpdateTimestamp: Date.now()
            },
          });
          
          console.log(`[${timestamp}] Атрибуты успешно обновлены при повторной попытке`);
          return true;
        } catch (retryError) {
          console.error(`[${timestamp}] Ошибка при повторной попытке:`, retryError);
          return false;
        }
      }, 50);
      
      return false;
    }
  }, [updateAttributes, editor]);

  // Функция сохранения при потере фокуса - немедленное сохранение
  const handleTitleBlur = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    console.log("Потеря фокуса заголовка, немедленное сохранение:", boardState?.boardTitle);
    saveStateToTiptap(boardState);
  };

  // Защита от проблем с рендерингом при нескольких экземплярах
  const instanceId = React.useMemo(() => `kanban-${generateId()}`, []);
  
  // Используем useLayoutEffect для предотвращения flushSync warning
  React.useLayoutEffect(() => {
    if (!node?.attrs?.boardState) return;
    
    try {
      // Мемоизируем данные для предотвращения лишних ре-рендеров
      const data = JSON.parse(JSON.stringify(node.attrs.boardState));
      if (data && data.columns && data.cards && data.columnOrder) {
        setBoardState(prevState => {
          // Сравниваем, действительно ли данные изменились
          if (JSON.stringify(prevState) === JSON.stringify(data)) {
            return prevState;
          }
          return data;
        });
      }
    } catch (error) {
      console.error(`[${instanceId}] Ошибка при обработке данных:`, error);
    }
  }, [node?.attrs?.boardState, instanceId]);

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
      
      // Асинхронно сохраняем в Tiptap
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
    
    // Сохраняем изменения немедленно
    saveStateToTiptap(updatedState);
  };
  
  // Референс для таймаута сохранения
  const saveTimeoutRef = React.useRef(null);
  
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
    
    // Отладочный вывод для проверки фильтрации
    console.log("Фильтрация:", { 
      текст: filterText, 
      приоритет: filterPriority,
      дедлайн: filterDeadline, 
      ids: ids.length,
      колонка: columnId 
    });
    
    return ids
      .map(cardId => boardState.cards[cardId])
      .filter(card => {
        if (!card) return false;
        
        // Фильтр по тексту
        const textMatch = !filterText || 
          card.title?.toLowerCase().includes(filterText.toLowerCase()) || 
          card.description?.toLowerCase().includes(filterText.toLowerCase()) ||
          (card.deadline && card.deadline.includes(filterText)); // Учитываем дедлайн при поиске
        
        // Фильтр по приоритету
        const priorityMatch = !filterPriority || card.priority === filterPriority;
        
        // Фильтр по дедлайну
        let deadlineMatch = true;
        if (filterDeadline) {
          // Если фильтр "с дедлайном", проверяем, что дедлайн установлен
          if (filterDeadline === 'with') {
            deadlineMatch = card.deadline && card.deadline.trim() !== '';
          }
          // Если фильтр "без дедлайна", проверяем, что дедлайн не установлен
          else if (filterDeadline === 'without') {
            deadlineMatch = !card.deadline || card.deadline.trim() === '';
          }
          // Если фильтр "просроченные", проверяем дату дедлайна
          else if (filterDeadline === 'expired') {
            if (!card.deadline || card.deadline.trim() === '') {
              deadlineMatch = false;
            } else {
              const deadlineDate = new Date(card.deadline);
              const currentDate = new Date();
              deadlineMatch = deadlineDate < currentDate;
            }
          }
          // Если фильтр "ближайшие", проверяем дату дедлайна (в течение 3 дней)
          else if (filterDeadline === 'upcoming') {
            if (!card.deadline || card.deadline.trim() === '') {
              deadlineMatch = false;
            } else {
              const deadlineDate = new Date(card.deadline);
              const currentDate = new Date();
              const timeDiff = deadlineDate.getTime() - currentDate.getTime();
              const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
              deadlineMatch = daysRemaining >= 0 && daysRemaining <= 3;
            }
          }
        }
        
        return textMatch && priorityMatch && deadlineMatch;
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
        },
        _updateTimeForDeadline: logTimestamp
      };
      
      // Устанавливаем задержку перед сохранением, чтобы избежать конфликтов при вставке
      setTimeout(() => {
        // 1. Сначала сохраняем в Tiptap
        const saveResult = saveStateToTiptap(updatedState);
        console.log(`[${logTimestamp}] Результат первичного сохранения:`, saveResult);
        
        // 2. Затем обновляем локальное состояние
        setBoardState(updatedState);
        
        // 3. Создаем глобальное событие для уведомления других компонентов
        const saveEvent = new CustomEvent('kanban-deadline-changed', {
          detail: { cardId, deadline: newDeadline, timestamp: Date.now() }
        });
        document.dispatchEvent(saveEvent);
      }, 10);
      
      // Дополнительная попытка сохранения с задержкой
      setTimeout(() => {
        // Сохраняем состояние ещё раз для надежности
        saveStateToTiptap(updatedState);
        console.log(`[${logTimestamp}] Выполнено дополнительное сохранение дедлайна`);
      }, 500);
      
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
          <div className="text-lg font-medium text-gray-900 dark:text-white mb-2 md:mb-0 w-1/3">
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
              className="kanban-board-title bg-transparent p-0 w-full text-lg font-medium text-gray-900 dark:text-white"
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
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Поиск:", e.target.value);
                  setFilterText(e.target.value);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Escape') {
                    setFilterText('');
                    e.target.blur();
                  }
                }}
                className="kanban-board-search text-sm rounded-md bg-white dark:bg-gray-800 py-1 px-3 text-gray-900 dark:text-white w-full sm:w-48"
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

            <select
              value={filterDeadline || ''}
              onChange={(e) => {
                e.stopPropagation();
                setFilterDeadline(e.target.value || null);
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1 px-3 text-gray-900 dark:text-white"
            >
              <option value="">Все задачи</option>
              <option value="with">С дедлайном</option>
              <option value="without">Без дедлайна</option>
              <option value="expired">Просроченные</option>
              <option value="upcoming">Ближайшие</option>
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