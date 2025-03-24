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
  XCircle
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface BlockSelectorProps {
  editor: any;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

type BlockCategory = 'Все' | 'Основные' | 'Медиа' | 'Макеты' | 'Выноски' | 'Продвинутые' | 'Стилизованные';

type Block = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: BlockCategory[];
  action?: (editor: any) => void;
  html?: string;
};

const insertHtml = (editor: any, html: string) => {
  // Проверяем, есть ли метод insertStyledHtmlBlock в редакторе
  if (editor && editor.commands && editor.commands.insertStyledHtmlBlock) {
    // Используем метод insertStyledHtmlBlock для сохранения CSS-классов
    editor.commands.insertStyledHtmlBlock(html);
  } else if (editor) {
    // Запасной вариант, если метод не доступен
    editor.commands.insertContent(html);
  }
  
  // Фокусируемся на редакторе после вставки
  if (editor) {
    editor.commands.focus();
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
      id: 'text',
      title: 'Текст',
      description: 'Обычный текстовый блок',
      icon: <FileText className="w-4 h-4" />,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().setParagraph().run();
      }
    },
    {
      id: 'heading1',
      title: 'Заголовок 1',
      description: 'Большой заголовок',
      icon: <span className="text-sm font-bold">H1</span>,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
      }
    },
    {
      id: 'heading2',
      title: 'Заголовок 2',
      description: 'Средний заголовок',
      icon: <span className="text-sm font-bold">H2</span>,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
      }
    },
    {
      id: 'heading3',
      title: 'Заголовок 3',
      description: 'Маленький заголовок',
      icon: <span className="text-sm font-bold">H3</span>,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
      }
    },
    {
      id: 'bulletList',
      title: 'Маркированный список',
      description: 'Список с маркерами',
      icon: <List className="w-4 h-4" />,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleBulletList().run();
      }
    },
    {
      id: 'orderedList',
      title: 'Нумерованный список',
      description: 'Список с нумерацией',
      icon: <ListOrdered className="w-4 h-4" />,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleOrderedList().run();
      }
    },
    {
      id: 'taskList',
      title: 'Список задач',
      description: 'Список с чекбоксами',
      icon: <CheckSquare className="w-4 h-4" />,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleTaskList().run();
      }
    },
    {
      id: 'codeBlock',
      title: 'Блок кода',
      description: 'Блок для форматированного кода',
      icon: <Code className="w-4 h-4" />,
      category: ['Все', 'Продвинутые'],
      action: (editor) => {
        editor.chain().focus().toggleCodeBlock().run();
      }
    },
    {
      id: 'highlight',
      title: 'Выделенный текст',
      description: 'Выделенный цветом текст',
      icon: <Highlighter className="w-4 h-4 text-yellow-500" />,
      category: ['Все', 'Основные'],
      html: `<p>Обычный текст <mark class="bg-yellow-200 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-1 rounded">выделенный текст</mark> продолжение параграфа.</p>`
    },
    {
      id: 'warning',
      title: 'Предупреждение',
      description: 'Блок предупреждения',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      category: ['Все', 'Выноски'],
      html: `<div class="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 text-amber-700 dark:text-amber-300 my-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">Внимание</p>
            <p class="text-sm mt-1">Здесь текст предупреждения.</p>
          </div>
        </div>
      </div>`
    },
    {
      id: 'info',
      title: 'Информация',
      description: 'Информационный блок',
      icon: <Info className="w-4 h-4 text-blue-500" />,
      category: ['Все', 'Выноски'],
      html: `<div class="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 my-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">Информация</p>
            <p class="text-sm mt-1">Здесь информационный текст.</p>
          </div>
        </div>
      </div>`
    },
    {
      id: 'success',
      title: 'Успех',
      description: 'Блок успешного действия',
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      category: ['Все', 'Выноски'],
      html: `<div class="p-4 bg-emerald-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-300 my-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">Успешно</p>
            <p class="text-sm mt-1">Действие успешно выполнено.</p>
          </div>
        </div>
      </div>`
    },
    {
      id: 'error',
      title: 'Ошибка',
      description: 'Блок с сообщением об ошибке',
      icon: <XCircle className="w-4 h-4 text-rose-500" />,
      category: ['Все', 'Выноски'],
      html: `<div class="p-4 bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 text-rose-700 dark:text-rose-300 my-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">Ошибка</p>
            <p class="text-sm mt-1">Произошла ошибка при выполнении действия.</p>
          </div>
        </div>
      </div>`
    },
    {
      id: 'divider',
      title: 'Разделитель',
      description: 'Горизонтальная линия',
      icon: <span className="w-4 h-0.5 bg-gray-400 rounded-full"></span>,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().setHorizontalRule().run();
        onClose();
      }
    },
    {
      id: 'callout',
      title: 'Выноска',
      description: 'Стилизованный блок с акцентом',
      icon: <Bookmark className="w-4 h-4 text-indigo-500" />,
      category: ['Все', 'Стилизованные', 'Выноски'],
      action: (editor) => {
        editor.chain().focus().insertContent(`<div class="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md text-indigo-700 dark:text-indigo-300 my-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium">Важная информация</p>
              <p class="text-sm mt-1">Здесь размещается важная информация, на которую стоит обратить внимание.</p>
            </div>
          </div>
        </div>`).run();
        onClose();
      }
    },
    {
      id: 'twoColumns',
      title: 'Две колонки',
      description: 'Разделенный на две колонки блок',
      icon: <Layout className="w-4 h-4 text-gray-600" />,
      category: ['Все', 'Макеты', 'Продвинутые'],
      action: (editor) => {
        editor.chain().focus().insertContent(`<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p>Содержимое первой колонки. Здесь можно разместить текст или другие элементы.</p>
          </div>
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p>Содержимое второй колонки. Здесь можно разместить текст или другие элементы.</p>
          </div>
        </div>`).run();
        onClose();
      }
    },
    {
      id: 'card',
      title: 'Карточка',
      description: 'Блок с тенью и рамкой',
      icon: <Square className="w-4 h-4 text-gray-500" />,
      category: ['Все', 'Стилизованные', 'Макеты'],
      html: `<div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 my-4">
        <h3 class="text-base font-medium text-gray-900 dark:text-white mb-2">Заголовок карточки</h3>
        <p class="text-gray-600 dark:text-gray-300">Содержимое карточки. Этот блок можно использовать для выделения важной информации или группировки связанного контента.</p>
      </div>`
    },
    {
      id: 'progressList',
      title: 'Чеклист с прогрессом',
      description: 'Список задач с индикатором',
      icon: <FileCheck className="w-4 h-4 text-emerald-500" />,
      category: ['Все', 'Продвинутые', 'Стилизованные'],
      html: `<div class="my-4">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white">Прогресс выполнения</h3>
          <span class="text-sm text-gray-500 dark:text-gray-400">2/5</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div class="bg-emerald-500 h-2 rounded-full" style="width: 40%;"></div>
        </div>
        <ul class="space-y-2">
          <li class="flex items-center">
            <div class="flex items-center h-5">
              <input id="task-1" type="checkbox" checked="checked" class="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500" />
            </div>
            <label for="task-1" class="ml-2 text-sm font-medium text-gray-500 line-through dark:text-gray-400">Задача 1</label>
          </li>
          <li class="flex items-center">
            <div class="flex items-center h-5">
              <input id="task-2" type="checkbox" checked="checked" class="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500" />
            </div>
            <label for="task-2" class="ml-2 text-sm font-medium text-gray-500 line-through dark:text-gray-400">Задача 2</label>
          </li>
          <li class="flex items-center">
            <div class="flex items-center h-5">
              <input id="task-3" type="checkbox" class="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500" />
            </div>
            <label for="task-3" class="ml-2 text-sm font-medium text-gray-900 dark:text-white">Задача 3</label>
          </li>
          <li class="flex items-center">
            <div class="flex items-center h-5">
              <input id="task-4" type="checkbox" class="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500" />
            </div>
            <label for="task-4" class="ml-2 text-sm font-medium text-gray-900 dark:text-white">Задача 4</label>
          </li>
          <li class="flex items-center">
            <div class="flex items-center h-5">
              <input id="task-5" type="checkbox" class="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500" />
            </div>
            <label for="task-5" class="ml-2 text-sm font-medium text-gray-900 dark:text-white">Задача 5</label>
          </li>
        </ul>
      </div>`
    },
    {
      id: 'timeline',
      title: 'Таймлайн',
      description: 'Временная шкала с этапами',
      icon: <Clock className="w-4 h-4 text-cyan-500" />,
      category: ['Все', 'Продвинутые', 'Стилизованные'],
      action: (editor) => {
        editor.chain().focus().insertContent(`<div class="my-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
          <div class="relative pl-6">
            <span class="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-cyan-500"></span>
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">Этап 1</h3>
            <time class="text-xs text-gray-500 dark:text-gray-400 mb-1">Январь 2023</time>
            <p class="text-sm text-gray-600 dark:text-gray-300">Описание первого этапа. Здесь можно разместить информацию о событии или задаче.</p>
          </div>
          <div class="relative pl-6">
            <span class="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-cyan-500"></span>
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">Этап 2</h3>
            <time class="text-xs text-gray-500 dark:text-gray-400 mb-1">Февраль 2023</time>
            <p class="text-sm text-gray-600 dark:text-gray-300">Описание второго этапа. Здесь можно разместить информацию о событии или задаче.</p>
          </div>
          <div class="relative pl-6">
            <span class="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-cyan-500"></span>
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">Этап 3</h3>
            <time class="text-xs text-gray-500 dark:text-gray-400 mb-1">Март 2023</time>
            <p class="text-sm text-gray-600 dark:text-gray-300">Описание третьего этапа. Здесь можно разместить информацию о событии или задаче.</p>
          </div>
        </div>`).run();
        onClose();
      }
    },
    {
      id: 'tipBlock',
      title: 'Подсказка',
      description: 'Блок с полезным советом',
      icon: <Lightbulb className="w-4 h-4 text-yellow-500" />,
      category: ['Все', 'Выноски', 'Стилизованные'],
      action: (editor) => {
        editor.chain().focus().insertContent(`<div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800 my-4">
          <div class="flex items-start">
            <div class="flex-shrink-0 mt-0.5">
              <svg class="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h4 class="text-sm font-medium text-yellow-800 dark:text-yellow-300">Совет</h4>
              <p class="text-sm text-yellow-700 dark:text-yellow-200 mt-1">Здесь можно разместить полезный совет или рекомендацию для читателя.</p>
            </div>
          </div>
        </div>`).run();
        onClose();
      }
    },
    {
      id: 'quoteWithAuthor',
      title: 'Цитата с автором',
      description: 'Оформленная цитата с источником',
      icon: <MessageSquare className="w-4 h-4 text-purple-500" />,
      category: ['Все', 'Выноски', 'Стилизованные'],
      action: (editor) => {
        editor.chain().focus().insertContent(`<div class="my-4 pl-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800 p-4 rounded-r-md">
          <p class="text-base italic font-medium leading-relaxed text-gray-700 dark:text-gray-300">«Единственный способ сделать что-то очень хорошо – это очень любить то, что ты делаешь.»</p>
          <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">— Стив Джобс</div>
        </div>`).run();
        onClose();
      }
    },
    {
      id: 'noteBlock',
      title: 'Заметка',
      description: 'Блок для личных заметок',
      icon: <PenTool className="w-4 h-4 text-rose-500" />,
      category: ['Все', 'Стилизованные'],
      html: `<div class="p-4 my-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-md">
        <div class="flex items-center mb-2">
          <svg class="h-5 w-5 text-rose-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          <h4 class="text-sm font-medium text-rose-700 dark:text-rose-300">Моя заметка</h4>
        </div>
        <p class="text-sm text-rose-600 dark:text-rose-200">Здесь можно добавить заметку для себя или для команды. Этот блок хорошо выделяется в общем тексте.</p>
      </div>`
    },
    {
      id: 'stepsBlock',
      title: 'Шаги процесса',
      description: 'Пронумерованные шаги с инструкциями',
      icon: <ArrowRight className="w-4 h-4 text-blue-500" />,
      category: ['Все', 'Продвинутые', 'Стилизованные'],
      html: `<div class="my-4 space-y-4">
        <h3 class="text-base font-medium text-gray-900 dark:text-white">Пошаговая инструкция</h3>
        <ol class="space-y-4">
          <li class="flex items-start">
            <div class="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium text-sm mr-3 mt-0.5">1</div>
            <div>
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">Первый шаг</h4>
              <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">Описание первого шага. Что именно нужно сделать и как это сделать правильно.</p>
            </div>
          </li>
          <li class="flex items-start">
            <div class="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium text-sm mr-3 mt-0.5">2</div>
            <div>
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">Второй шаг</h4>
              <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">Описание второго шага. Что нужно сделать после выполнения первого шага.</p>
            </div>
          </li>
          <li class="flex items-start">
            <div class="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium text-sm mr-3 mt-0.5">3</div>
            <div>
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">Третий шаг</h4>
              <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">Описание третьего шага. Завершающие действия и результат.</p>
            </div>
          </li>
        </ol>
      </div>`
    },
    {
      id: 'textHighlight',
      title: 'Выделенный текст',
      description: 'Текст с цветным фоном',
      icon: <AlignLeft className="w-4 h-4 text-teal-500" />,
      category: ['Все', 'Основные', 'Стилизованные'],
      action: (editor) => {
        editor.chain().focus().insertContent('<span class="bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 px-1 py-0.5 rounded">выделенный текст</span>').run();
        onClose();
      }
    },
    {
      id: 'button',
      title: 'Кнопка',
      description: 'Стилизованная кнопка с ссылкой',
      icon: <MousePointer className="w-4 h-4 text-blue-500" />,
      category: ['Все', 'Стилизованные', 'Продвинутые'],
      html: `<a href="#" class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors my-2">
        <span>Нажмите здесь</span>
        <svg class="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </a>`
    },
    {
      id: 'accordion',
      title: 'Аккордеон',
      description: 'Раскрывающийся блок информации',
      icon: <ChevronDown className="w-4 h-4 text-gray-600" />,
      category: ['Все', 'Продвинутые', 'Макеты'],
      html: `<div class="my-4 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div class="flex justify-between items-center font-medium cursor-pointer p-4">
            <div>Раскрывающийся блок</div>
            <div class="text-gray-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-600 dark:text-gray-400">Этот блок изначально скрыт и раскрывается при клике на заголовок. Здесь можно разместить дополнительную информацию, которая не должна занимать место на странице постоянно.</p>
          </div>
        </div>
        <div class="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div class="flex justify-between items-center font-medium cursor-pointer p-4">
            <div>Еще один блок</div>
            <div class="text-gray-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-600 dark:text-gray-400">Контент второго раскрывающегося блока. Аккордеоны хороши для FAQ или структурированной информации с заголовками.</p>
          </div>
        </div>
      </div>`
    },
    {
      id: 'statCard',
      title: 'Статистическая карточка',
      description: 'Блок с числовыми данными',
      icon: <BarChart className="w-4 h-4 text-violet-500" />,
      category: ['Все', 'Стилизованные', 'Продвинутые'],
      html: `<div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
        <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="flex-shrink-0 mr-3">
              <div class="p-2 bg-violet-100 dark:bg-violet-900/20 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" class="text-violet-500" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </div>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Посещения</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">12,540</p>
              <p class="text-sm text-green-500">+12.5% с прошлого месяца</p>
            </div>
          </div>
        </div>
        
        <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="flex-shrink-0 mr-3">
              <div class="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" class="text-emerald-500" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
              </div>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Просмотры</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">34,680</p>
              <p class="text-sm text-green-500">+8.3% с прошлого месяца</p>
            </div>
          </div>
        </div>
        
        <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="flex-shrink-0 mr-3">
              <div class="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" class="text-amber-500" fill="currentColor">
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
                </svg>
              </div>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Конверсия</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">6.4%</p>
              <p class="text-sm text-red-500">-2.1% с прошлого месяца</p>
            </div>
          </div>
        </div>
      </div>`
    },
    {
      id: 'gallery',
      title: 'Галерея',
      description: 'Сетка изображений в ряд',
      icon: <Images className="w-4 h-4 text-pink-500" />,
      category: ['Все', 'Медиа', 'Стилизованные'],
      html: `<div class="my-4">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div class="relative aspect-[4/3] rounded-md overflow-hidden">
            <img src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5" alt="Пример изображения" class="w-full h-full object-cover" />
          </div>
          <div class="relative aspect-[4/3] rounded-md overflow-hidden">
            <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f" alt="Пример изображения" class="w-full h-full object-cover" />
          </div>
          <div class="relative aspect-[4/3] rounded-md overflow-hidden">
            <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085" alt="Пример изображения" class="w-full h-full object-cover" />
          </div>
        </div>
        <p class="text-xs text-gray-500 text-center mt-2">Примеры изображений. Замените их на ваши собственные.</p>
      </div>`
    },
    {
      id: 'gradientCard',
      title: 'Градиентная карточка',
      description: 'Карточка с градиентным фоном',
      icon: <Palette className="w-4 h-4 text-indigo-500" />,
      category: ['Все', 'Стилизованные', 'Макеты'],
      html: `<div class="p-6 my-4 rounded-lg relative overflow-hidden text-white" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div class="relative z-10">
          <h3 class="text-xl font-bold mb-2">Яркий заголовок</h3>
          <p class="text-white/90">Этот блок с градиентным фоном привлекает внимание и может использоваться для важных объявлений или акцентов в тексте.</p>
          <a href="#" class="inline-block mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md backdrop-blur-sm text-sm font-medium transition-colors">Подробнее</a>
        </div>
      </div>`
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
    const matchesCategory = activeCategory === 'Все' || block.category.includes(activeCategory);
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
  const insertBlock = (blockHtml: string) => {
    insertHtml(editor, blockHtml);
    onClose();
  };

  // Функция для вставки встроенного блока TipTap
  const insertBuiltInBlock = (action: (editor: any) => void) => {
    action(editor);
    onClose();
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
            {(['Все', 'Основные', 'Медиа', 'Макеты', 'Выноски', 'Продвинутые', 'Стилизованные'] as BlockCategory[]).map((category) => (
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
                  } else {
                    // Для HTML-блоков используем insertBlock, который использует insertStyledHtmlBlock
                    insertBlock(block.html || '');
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
