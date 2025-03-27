import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin, PluginKey } from 'prosemirror-state';
import { TextSelection } from 'prosemirror-state';
import React from 'react';
import KanbanBoardComponent from './KanbanBoardComponent';

// Определение интерфейса для аттрибутов канбан-доски
export interface KanbanBoardAttrs {
  boardState: any; // Изменено с string на any для корректной обработки объектов
}

// Тип для обработчика событий DOM
type DOMEventHandler = (event: Event) => void;

// Определение узла для канбан-доски
export const InteractiveKanbanNode = Node.create<{
  buttonIcon?: string;
  buttonLabel?: string;
}>({
  name: 'kanbanBoard', // Изменено с interactiveKanban на kanbanBoard для соответствия с компонентом

  group: 'block',

  atom: true, // Узел должен быть атомарным, так как внутреннее содержимое управляется React-компонентом

  draggable: true,

  // Добавление атрибутов
  addAttributes() {
    return {
      boardState: {
        default: {
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
        }, // Используем объект по умолчанию вместо null
        parseHTML: (element) => {
          try {
            const boardData = element.getAttribute('data-board-state');
            if (boardData) {
              return JSON.parse(boardData);
            }
          } catch (error) {
            console.error('Ошибка при разборе boardState:', error);
          }
          return undefined; // Вернем undefined, чтобы использовать значение по умолчанию
        },
        renderHTML: (attributes) => {
          try {
            if (attributes && typeof attributes === 'object') {
              // Обеспечиваем сохранение всех изменений в DOM-атрибуте
              const cleanAttributes = JSON.parse(JSON.stringify(attributes));
              // Добавляем дополнительную метку времени для надежности сохранения
              cleanAttributes._htmlRenderTime = Date.now();
              return { 'data-board-state': JSON.stringify(cleanAttributes) };
            }
          } catch (error) {
            console.error('Ошибка при рендеринге boardState:', error);
          }
          return {};
        },
      },
    };
  },

  // Функция для обработки HTML при парсинге
  parseHTML() {
    return [
      {
        tag: 'div[data-kanban-board]',
      },
    ];
  },

  // Функция для рендеринга HTML
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-kanban-board': 'true', class: 'interactive-kanban' })];
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
        key: new PluginKey('kanbanBoardHandling'),
        props: {
          handleDOMEvents: {
            mousedown: (view, event) => {
              // Если клик происходит вне узла kanban - не мешаем стандартному поведению
              const target = event.target as HTMLElement;
              const kanbanNode = target.closest('[data-kanban-board="true"]');
              
              if (!kanbanNode) {
                return false; // Не наш клик, пусть его обрабатывает редактор
              }
              
              // Получаем размеры канбан-доски
              const rect = kanbanNode.getBoundingClientRect();
              
              // Если клик произошел ниже канбан-доски или в специальной области ::after
              if (event.clientY > rect.bottom - 30) {
                // Проверяем - находится ли курсор в пределах 30px от нижней границы
                const afterArea = event.clientY <= rect.bottom && event.clientY > rect.bottom - 30;
                
                if (afterArea) {
                  // Если клик в пределах ::after области, создаем новый параграф после
                  // Находим узел канбан-доски в документе редактора
                  const { state } = view;
                  const { doc, selection } = state;
                  let kanbanPos = -1;
                  let nodeSize = 0;
                  
                  // Найдем позицию узла канбан-доски в документе
                  doc.nodesBetween(0, doc.content.size, (node, pos) => {
                    if (node.type.name === 'kanbanBoard') {
                      kanbanPos = pos;
                      nodeSize = node.nodeSize;
                      return false; // Останавливаем поиск
                    }
                    return true;
                  });
                  
                  if (kanbanPos !== -1) {
                    // Вычисляем позицию после узла канбан-доски
                    const posAfter = kanbanPos + nodeSize;
                    
                    // Устанавливаем выделение после канбан-доски
                    view.dispatch(
                      state.tr.setSelection(
                        TextSelection.create(state.doc, posAfter, posAfter)
                      )
                    );
                    
                    // Устанавливаем фокус на редактор
                    view.focus();
                    
                    // Предотвращаем дальнейшую обработку клика
                    event.stopPropagation();
                    event.preventDefault();
                    return true;
                  }
                }
                
                // Не обрабатываем клик, позволяем редактору создать новый параграф
                return false;
              }
              
              // Если клик внутри канбан-доски, обрабатываем его в компоненте
              return false; // Пусть компонент обработает клик
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