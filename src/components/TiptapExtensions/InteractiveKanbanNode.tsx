import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin, PluginKey } from 'prosemirror-state';
import React from 'react';
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

  // Добавление атрибутов
  addAttributes() {
    return {
      boardState: {
        default: null,
      },
    };
  },

  // Функция для обработки HTML при парсинге
  parseHTML() {
    return [
      {
        tag: 'div.interactive-kanban',
      },
    ];
  },

  // Функция для рендеринга HTML
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'interactive-kanban' })];
  },

  // Добавляем поддержку для отображения в редакторе
  addNodeView() {
    return ReactNodeViewRenderer(KanbanBoardComponent);
  },

  // Добавление плагинов
  addProseMirrorPlugins() {
    const plugins: Plugin[] = [];
    
    // Добавление плагина для правильного взаимодействия с редактором
    plugins.push(
      new Plugin({
        key: new PluginKey('interactiveKanbanHandling'),
        props: {
          handleDOMEvents: {
            mousedown: (view, event) => {
              // Если клик происходит вне узла kanban - не мешаем стандартному поведению
              const target = event.target as HTMLElement;
              if (!target.closest('[data-kanban-board="true"]')) {
                return false;
              }
              return false;
            }
          }
        }
      })
    );
    
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