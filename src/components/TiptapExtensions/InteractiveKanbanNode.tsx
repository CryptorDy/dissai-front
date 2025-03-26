import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin, PluginKey } from 'prosemirror-state';
import KanbanBoardComponent from './KanbanBoardComponent';

// Определение интерфейса для аттрибутов канбан-доски
export interface KanbanBoardAttrs {
  boardState: string;
}

// Тип для обработчика событий DOM
type DOMEventHandler = (event: Event) => void;

// Определение узла для канбан-доски
export const InteractiveKanbanNode = Node.create<{
  buttonIcon?: string;
  buttonLabel?: string;
}>({
  name: 'interactiveKanban',

  group: 'block',

  atom: true, // Узел должен быть атомарным, так как внутреннее содержимое управляется React-компонентом

  draggable: true,

  addAttributes() {
    return {
      boardState: {
        default: JSON.stringify({
          // Начальное состояние канбан-доски
          cards: {
            'card-1': { id: 'card-1', title: 'Задача 1', description: 'Описание задачи 1' },
            'card-2': { id: 'card-2', title: 'Задача 2', description: 'Описание задачи 2' },
            'card-3': { id: 'card-3', title: 'Задача 3', description: 'Описание задачи 3' },
          },
          columns: [
            {
              id: 'column-1',
              title: 'Планируется',
              cardIds: ['card-1'],
            },
            {
              id: 'column-2',
              title: 'В процессе',
              cardIds: ['card-2'],
            },
            {
              id: 'column-3',
              title: 'Завершено',
              cardIds: ['card-3'],
            },
          ],
          columnOrder: ['column-1', 'column-2', 'column-3'],
        }),
      },
    };
  },

  // Функция для обработки HTML при парсинге
  parseHTML() {
    return [
      {
        tag: 'div[data-type="interactive-kanban"]',
        getAttrs: (node) => {
          if (!(node instanceof HTMLElement)) {
            return {};
          }

          try {
            // Извлекаем состояние доски из атрибута data-board-state
            const boardStateStr = node.getAttribute('data-board-state');
            if (boardStateStr) {
              // Пытаемся распарсить JSON
              const boardState = JSON.parse(boardStateStr);
              console.log('Восстановлено состояние доски:', boardState);
              return { boardState };
            }
          } catch (error) {
            console.error('Ошибка при парсинге состояния доски:', error);
          }
          
          return {};
        }
      },
    ];
  },

  // Функция для рендеринга HTML
  renderHTML({ HTMLAttributes }) {
    try {
      const attrs = mergeAttributes(HTMLAttributes);
      let boardStateString = '';
      
      // Преобразуем boardState в строку, если это объект
      if (typeof attrs.boardState === 'object' && attrs.boardState !== null) {
        boardStateString = JSON.stringify(attrs.boardState);
      } else if (typeof attrs.boardState === 'string') {
        // Проверяем, что строка валидный JSON
        try {
          JSON.parse(attrs.boardState);
          boardStateString = attrs.boardState;
        } catch (e) {
          console.error('Невалидный JSON в attrs.boardState:', e);
          boardStateString = '{}';
        }
      } else {
        boardStateString = '{}';
      }
      
      // Для отладки
      console.log("renderHTML для канбан-доски:", boardStateString.slice(0, 50) + '...');
      
      return ['div', { 
        'data-type': 'interactive-kanban',
        'data-board-state': boardStateString,
        'contenteditable': 'false',
        'class': 'interactive-kanban-container',
        'style': 'min-height: 100px; background-color: #f9fafb; border: 1px dashed #d1d5db; border-radius: 0.375rem; margin: 1rem 0;'
      }, ['div', { class: 'kanban-placeholder' }, 'Канбан-доска']];
    } catch (error) {
      console.error('Ошибка при рендеринге канбан-доски:', error);
      return ['div', { 'data-type': 'interactive-kanban', 'class': 'interactive-kanban-error' }, 'Ошибка загрузки канбан-доски'];
    }
  },

  // Добавляем поддержку для отображения в редакторе
  addNodeView() {
    return ReactNodeViewRenderer(KanbanBoardComponent);
  },

  // Добавление плагинов
  addProseMirrorPlugins() {
    const plugins: Plugin[] = [];
    return plugins;
  },

  // Настройки для кнопки добавления в меню
  addOptions() {
    return {
      buttonIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>',
      buttonLabel: 'Канбан-доска',
    };
  },
}); 