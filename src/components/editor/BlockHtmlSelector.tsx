import React, { useState, useEffect, useRef } from 'react';
import { 
  Code, 
  Image, 
  Table, 
  CheckSquare, 
  Quote, 
  FileText, 
  List, 
  ListOrdered,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Bookmark,
  Layout,
  FileCheck,
  Clock,
  Lightbulb,
  MessageSquare,
  PenTool,
  Square,
  ArrowRight,
  AlignLeft,
  MousePointer,
  ChevronDown,
  BarChart,
  Images,
  Palette,
  Highlighter,
  XCircle,
  Check,
  BookOpen,
  Link2,
  Grid2x2
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface BlockSelectorProps {
  editor: any;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

type BlockCategory = 'Все' | 'Основные' | 'Медиа' | 'Макеты' | 'Выноски' | 'Продвинутые' | 'Стилизованные' | 'Notion';

type Block = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  categories: BlockCategory[];
  action?: (editor: any) => void;
  html?: string;
  insert?: {
    type: string;
    attrs: any;
  };
};

// Функция для закрытия селектора блоков
const closeBlockSelector = () => {
  // Скрываем селектор блоков, если он открыт
  const selector = document.querySelector('.block-selector');
  if (selector) {
    selector.classList.add('hidden');
  }
};

const insertHtml = (editor: any, html: string, blockId?: string) => {
  try {
    // Проверяем на канбан-доску по идентификатору блока, а не только по HTML-содержимому
    if (blockId === 'kanban-board' || (html && (html.includes('interactive-kanban') || html.includes('kanban-board')))) {
      console.log('Обнаружена канбан-доска, используем специальную вставку');
      
      try {
        // Вставляем канбан-доску как специальный узел
        if (editor.can().chain().focus().insertContent({ type: 'kanbanBoard', attrs: {} }).run()) {
          editor.chain().focus().insertContent({ type: 'kanbanBoard', attrs: {} }).run();
          
          // Закрываем селектор блоков
          closeBlockSelector();
          console.log('Канбан-доска успешно вставлена');
          return true;
        } else {
          console.error('Редактор не может вставить канбан-доску');
        }
      } catch (error) {
        console.error('Ошибка при вставке канбан-доски:', error);
      }
      return false;
    }
    
    // Очищаем HTML от возможных проблемных атрибутов
    let cleanHtml = html
      .replace(/\n\s+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Создаем временный div для анализа HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHtml;
    
    // Проверяем, нужно ли оборачивать HTML в div data-type="html-block"
    let htmlToInsert = cleanHtml;
    const rootElement = tempDiv.firstElementChild;
    if (rootElement && !rootElement.hasAttribute('data-type')) {
      htmlToInsert = `<div data-type="html-block">${cleanHtml}</div>`;
    }
    
    // Основной подход: вставка HTML напрямую в DOM, минуя парсинг TipTap
    
    // 1. Создаем пустой HTMLBlockNode
    const emptyHtmlNode = {
      type: 'htmlBlock',
      attrs: {
        'data-type': 'html-block'
      },
      content: []
    };
    
    // 2. Вставляем пустой узел
    editor.commands.insertContent(emptyHtmlNode);
    
    // 3. Находим созданный узел в DOM и заменяем его содержимое напрямую
    setTimeout(() => {
      // Получаем текущую позицию и узлы
      const view = editor.view;
      const state = view.state;
      const selection = state.selection;
      
      // Находим недавно вставленный узел с атрибутом data-type="html-block"
      const htmlBlocks = document.querySelectorAll('[data-type="html-block"]');
      if (htmlBlocks.length > 0) {
        // Берем последний вставленный блок
        const latestBlock = htmlBlocks[htmlBlocks.length - 1];
        
        // Очищаем содержимое узла
        while (latestBlock.firstChild) {
          latestBlock.removeChild(latestBlock.firstChild);
        }
        
        // Вставляем HTML напрямую, минуя парсер TipTap
        latestBlock.innerHTML = htmlToInsert;
        
        // Добавляем класс для визуального отображения
        latestBlock.classList.add('tiptap-nodeview-block');
        
        // Добавляем кнопку удаления
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('tiptap-nodeview-delete');
        deleteButton.innerHTML = '✕';
        deleteButton.title = 'Удалить блок';
        latestBlock.appendChild(deleteButton);
        
        // Добавляем обработчик удаления
        deleteButton.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          // Находим узел в структуре TipTap и удаляем его
          const pos = editor.view.posAtDOM(latestBlock, 0);
          if (pos !== null) {
            const textLength = latestBlock.textContent ? latestBlock.textContent.length : 0;
            editor.commands.deleteRange({ from: pos, to: pos + textLength + 2 });
          }
        });
      }
      
      // Фокусируемся на редакторе
      editor.commands.focus();
    }, 10);
    
    return;
  } catch (globalError) {
    console.error('Критическая ошибка при вставке:', globalError);
    // В крайнем случае просто вставляем обычный текст
    try {
      editor.commands.insertText('Блок контента');
    } catch (e) {
      // Молча игнорируем ошибку, если уже ничего не помогает
    }
  }
  
  // Фокусируемся на редакторе после вставки
  try {
    if (editor && editor.commands && editor.commands.focus) {
    editor.commands.focus();
    }
  } catch (e) {
    // Игнорируем ошибку фокуса
  }
};

export function BlockSelector({ editor, isOpen, onClose, position }: BlockSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<BlockCategory>('Все');
  const selectorRef = useRef<HTMLDivElement>(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  
  // Определяем блоки
  const blocks: Block[] = [
    
    {
      id: 'heading1',
      title: 'Заголовок 1',
      description: 'Большой заголовок',
      icon: <span className="text-sm font-bold">H1</span>,
      categories: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
      }
    },
    {
      id: 'heading2',
      title: 'Заголовок 2',
      description: 'Средний заголовок',
      icon: <span className="text-sm font-bold">H2</span>,
      categories: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
      }
    },
    {
      id: 'heading3',
      title: 'Заголовок 3',
      description: 'Маленький заголовок',
      icon: <span className="text-sm font-bold">H3</span>,
      categories: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
      }
    },
    {
      id: 'bulletList',
      title: 'Маркированный список',
      description: 'Список с маркерами',
      icon: <List className="w-4 h-4" />,
      categories: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleBulletList().run();
      }
    },
    {
      id: 'orderedList',
      title: 'Нумерованный список',
      description: 'Список с нумерацией',
      icon: <ListOrdered className="w-4 h-4" />,
      categories: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleOrderedList().run();
      }
    },
    {
      id: 'taskList',
      title: 'Список задач',
      description: 'Список с чекбоксами',
      icon: <CheckSquare className="w-4 h-4" />,
      categories: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleTaskList().run();
      }
    },
    {
      id: 'codeBlock',
      title: 'Блок кода',
      description: 'Блок для форматированного кода',
      icon: <Code className="w-4 h-4" />,
      categories: ['Все', 'Продвинутые'],
      action: (editor) => {
        editor.chain().focus().toggleCodeBlock().run();
      }
    },
    {
      id: 'divider',
      title: 'Разделитель',
      description: 'Горизонтальная линия',
      icon: <span className="w-4 h-0.5 bg-gray-400 rounded-full"></span>,
      categories: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().setHorizontalRule().run();
        onClose();
      }
    },
    {
      id: 'callout',
      title: 'Выноска',
      description: 'Блок с цветной рамкой и иконкой',
      icon: <BookOpen className="w-4 h-4 text-blue-500" />,
      categories: ['Все', 'Notion'],
      html: `<div class="callout-block p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-md" data-type="html-block">
        <div class="flex">
          <div class="flex-shrink-0 text-blue-500 mr-3">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <p class="text-gray-800 dark:text-gray-200">Это блок выноски в стиле Notion. Здесь можно размещать важную информацию, которую вы хотите выделить.</p>
          </div>
        </div>
      </div>`
    },
    {
      id: 'toggle',
      title: 'Сворачиваемый блок',
      description: 'Блок, который можно свернуть',
      icon: <ChevronDown className="w-4 h-4 text-gray-500" />,
      categories: ['Все', 'Notion'],
      html: `<div class="toggle-block my-2" data-type="html-block">
        <div class="toggle-header cursor-pointer p-2 bg-gray-50 dark:bg-gray-800 flex items-center text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-md" onclick="
          const content = this.nextElementSibling;
          const arrow = this.querySelector('.toggle-arrow');
          if (content.style.display === 'none' || !content.style.display) {
            content.style.display = 'block';
            arrow.style.transform = 'rotate(90deg)';
          } else {
            content.style.display = 'none';
            arrow.style.transform = 'rotate(0deg)';
          }
        ">
          <span class="toggle-arrow mr-2 inline-block transition-transform" style="transform: rotate(0deg);">▶</span>
          <span class="font-medium">Сворачиваемый блок (нажмите, чтобы развернуть)</span>
          </div>
        <div class="toggle-content pl-6 pt-2 pb-1 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-md" style="display: none;">
          <p class="text-gray-700 dark:text-gray-300">Здесь размещается контент, который можно скрыть или показать. Это удобно для длинных пояснений или дополнительной информации.</p>
        </div>
      </div>`
    },
    {
      id: 'noteBlock',
      title: 'Заметка',
      description: 'Простая заметка',
      icon: <PenTool className="w-4 h-4 text-gray-500" />,
      categories: ['Все', 'Notion'],
      html: `<div class="note-block" data-type="html-block">
        <p>Это простая заметка. Используйте её для коротких сообщений или напоминаний.</p>
      </div>`
    },
    {
      id: 'tipBlock',
      title: 'Подсказка',
      description: 'Блок с полезным советом',
      icon: <Lightbulb className="w-4 h-4 text-yellow-500" />,
      categories: ['Все', 'Notion'],
      html: `<div class="tip-block p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg" data-type="html-block">
          <div class="flex">
          <div class="flex-shrink-0 text-yellow-500 mr-3">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
            </div>
          <div>
            <p class="text-yellow-700 font-medium">Совет</p>
            <p class="text-yellow-600">Полезная рекомендация, которая поможет улучшить результат или сделать работу быстрее.</p>
            </div>
          </div>
      </div>`
    },
    {
      id: 'simpleTable',
      title: 'Таблица',
      description: 'Таблица с данными',
      icon: <Table className="w-4 h-4 text-gray-600" />,
      categories: ['Все', 'Notion'],
      html: `<div class="table-wrapper my-4" data-type="html-block">
        <table class="w-full border-collapse">
          <tr>
            <th class="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-left">Заголовок 1</th>
            <th class="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-left">Заголовок 2</th>
          </tr>
          <tr>
            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2">Ячейка 1</td>
            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2">Ячейка 2</td>
          </tr>
          <tr>
            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2">Ячейка 3</td>
            <td class="border border-gray-300 dark:border-gray-600 px-4 py-2">Ячейка 4</td>
          </tr>
        </table>
      </div>`
    },
    {
      id: 'stepsBlock',
      title: 'Пошаговая инструкция',
      description: 'Пронумерованные шаги с инструкциями',
      icon: <ArrowRight className="w-4 h-4 text-blue-500" />,
      categories: ['Все', 'Notion'],
      html: `<div class="steps-block" data-type="html-block">
        <h3 class="text-base font-medium text-gray-900 dark:text-white mb-4">Пошаговая инструкция</h3>
        <ol class="steps-list space-y-6 pl-0 list-none">
          <li class="step-item">
            <div class="flex items-start">
              <div class="step-number flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full mr-3 mt-0.5">1</div>
              <div class="step-content">
                <h4>Первый шаг</h4>
                <p class="text-gray-600 dark:text-gray-300 mt-1">Описание первого шага. Что именно нужно сделать и как это сделать правильно.</p>
        </div>
        </div>
          </li>
          <li class="step-item">
            <div class="flex items-start">
              <div class="step-number flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full mr-3 mt-0.5">2</div>
              <div class="step-content">
                <h4>Второй шаг</h4>
                <p class="text-gray-600 dark:text-gray-300 mt-1">Описание второго шага. Что нужно сделать после выполнения первого шага.</p>
            </div>
            </div>
          </li>
          <li class="step-item">
            <div class="flex items-start">
              <div class="step-number flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full mr-3 mt-0.5">3</div>
              <div class="step-content">
                <h4>Третий шаг</h4>
                <p class="text-gray-600 dark:text-gray-300 mt-1">Описание третьего шага. Завершающие действия и результат.</p>
            </div>
            </div>
          </li>
        </ol>
      </div>`
    },
    {
      id: 'quoteWithAuthor',
      title: 'Цитата с автором',
      description: 'Оформленная цитата с источником',
      icon: <MessageSquare className="w-4 h-4 text-purple-500" />,
      categories: ['Все', 'Notion'],
      html: `<div class="quote-block p-4 pl-6 border-l-4 border-gray-400 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-600 my-4" data-type="html-block">
          <p class="text-base italic font-medium leading-relaxed text-gray-700 dark:text-gray-300">«Единственный способ сделать что-то очень хорошо – это очень любить то, что ты делаешь.»</p>
          <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">— Стив Джобс</div>
      </div>`
    },
    {
      id: 'cssTaskListAdvanced',
      title: 'Список задач',
      description: 'Расширенный список задач с метками',
      icon: <CheckSquare className="w-4 h-4 text-blue-500" />,
      categories: ['Все', 'Notion'],
      html: `<div class="task-list-advanced p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm" data-type="html-block">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-base font-medium text-gray-900 dark:text-white">Проект: Запуск сайта</h3>
          <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">В процессе</span>
        </div>
        
        <div class="space-y-3">
          <div class="task-item">
            <input type="checkbox" id="advtask1" class="task-checkbox peer hidden" />
            <label for="advtask1" class="flex items-start cursor-pointer">
              <span class="task-checkbox-icon flex-shrink-0 w-5 h-5 border border-gray-300 dark:border-gray-600 rounded mr-3 mt-0.5 flex items-center justify-center peer-checked:bg-blue-500 peer-checked:border-blue-500 dark:peer-checked:bg-blue-600 dark:peer-checked:border-blue-600 transition-colors">
                <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
        </svg>
              </span>
              <div class="flex-1">
                <div class="flex flex-wrap items-center">
                  <span class="text-gray-700 dark:text-gray-300 peer-checked:text-gray-500 dark:peer-checked:text-gray-400 peer-checked:line-through transition-colors">Подготовить графические материалы</span>
                  <span class="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">Высокий</span>
                </div>
                <div class="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
                  <span>Дедлайн: 25 марта</span>
            </div>
          </div>
            </label>
          </div>
          
          <div class="task-item">
            <input type="checkbox" id="advtask2" class="task-checkbox peer hidden" checked />
            <label for="advtask2" class="flex items-start cursor-pointer">
              <span class="task-checkbox-icon flex-shrink-0 w-5 h-5 border border-gray-300 dark:border-gray-600 rounded mr-3 mt-0.5 flex items-center justify-center peer-checked:bg-blue-500 peer-checked:border-blue-500 dark:peer-checked:bg-blue-600 dark:peer-checked:border-blue-600 transition-colors">
                <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </span>
              <div class="flex-1">
                <div class="flex flex-wrap items-center">
                  <span class="text-gray-700 dark:text-gray-300 peer-checked:text-gray-500 dark:peer-checked:text-gray-400 peer-checked:line-through transition-colors">Создать структуру сайта</span>
                  <span class="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">Завершено</span>
        </div>
                <div class="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
                  <span>Завершено 20 марта</span>
            </div>
          </div>
            </label>
          </div>
          
          <div class="task-item">
            <input type="checkbox" id="advtask3" class="task-checkbox peer hidden" />
            <label for="advtask3" class="flex items-start cursor-pointer">
              <span class="task-checkbox-icon flex-shrink-0 w-5 h-5 border border-gray-300 dark:border-gray-600 rounded mr-3 mt-0.5 flex items-center justify-center peer-checked:bg-blue-500 peer-checked:border-blue-500 dark:peer-checked:bg-blue-600 dark:peer-checked:border-blue-600 transition-colors">
                <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </span>
              <div class="flex-1">
                <div class="flex flex-wrap items-center">
                  <span class="text-gray-700 dark:text-gray-300 peer-checked:text-gray-500 dark:peer-checked:text-gray-400 peer-checked:line-through transition-colors">Настроить аналитику и SEO</span>
                  <span class="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs rounded-full">Средний</span>
                </div>
                <div class="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span>Дедлайн: 30 марта</span>
                </div>
              </div>
            </label>
          </div>
        </div>
        
        <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div class="text-xs text-gray-500 dark:text-gray-400">
            <span class="font-medium">Прогресс:</span> 1/3 задач выполнено
          </div>
          <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div class="bg-blue-500 h-full rounded-full" style="width: 33%"></div>
          </div>
        </div>
      </div>`
    },
    {
      id: 'kanban-board',
      title: 'Канбан-доска',
      description: 'Добавить канбан-доску для управления задачами',
      icon: <Grid2x2 size={20} className="mr-2" />,
      categories: ['Все', 'Продвинутые', 'Макеты'],
      insert: {
        type: 'kanbanBoard',
        attrs: {}
      }
    }
  ];

  // Закрытие селектора при клике вне его
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Фильтрация блоков по поиску и категории
  const filteredBlocks = blocks.filter(block => {
    const matchesSearch = block.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          block.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Все' || block.categories.includes(activeCategory);
    return matchesSearch && matchesCategory;
  });

  // Вычисляем позицию окна в центре экрана
  useEffect(() => {
    if (isOpen) {
      // Центрируем модальное окно
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Предполагаемые размеры модального окна
      const modalWidth = 500; // примерная ширина
      const modalHeight = 600; // примерная высота
      
      setModalPosition({
        top: Math.max(20, (viewportHeight - modalHeight) / 2),
        left: Math.max(20, (viewportWidth - modalWidth) / 2)
      });
    }
  }, [isOpen]);

  // Функция для вставки блока HTML
  const insertBlock = (blockHtml: string, blockId?: string) => {
    insertHtml(editor, blockHtml, blockId);
    setTimeout(() => {
      onClose();
    }, 0);
  };

  // Функция для вставки встроенного блока TipTap
  const insertBuiltInBlock = (action: (editor: any) => void) => {
    action(editor);
    setTimeout(() => {
    onClose();
    }, 0);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={selectorRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl overflow-hidden"
        style={{ 
          maxHeight: '70vh'
        }}
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-base font-medium text-gray-900 dark:text-white">Вставить блок</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск блоков..."
              className="w-full p-2 pl-8 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="flex p-1.5">
            {(['Все', 'Основные', 'Медиа', 'Макеты', 'Выноски', 'Продвинутые', 'Стилизованные', 'Notion'] as BlockCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-2.5 py-0.5 text-xs rounded-md mr-1 whitespace-nowrap ${
                  activeCategory === category
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 140px)' }}>
          <div className="grid grid-cols-3 gap-2 p-3">
            {filteredBlocks.map((block) => (
              <button
                key={block.id}
                onClick={() => {
                  // Проверяем, есть ли HTML-контент в блоке
                  if (typeof block.action === 'function') {
                    // Для стандартных блоков TipTap используем прямой вызов action
                    insertBuiltInBlock(block.action);
                  } else if (block.insert) {
                    // Для специальных типов блоков (например, канбан-доски)
                    editor.chain().focus().insertContent(block.insert).run();
                    onClose();
                  } else {
                    // Для HTML-блоков используем insertBlock, который использует insertStyledHtmlBlock
                    insertBlock(block.html || '', block.id);
                  }
                }}
                className="flex flex-col items-start p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center w-full mb-1">
                  <div className="flex-shrink-0 text-gray-500 dark:text-gray-400 mr-2">
                    {block.icon}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{block.title}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{block.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

