import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { common, createLowlight } from 'lowlight';
import { FileDown, Plus, X, Type, Grid2x2 } from 'lucide-react';
import { Toolbar } from './editor/Toolbar';
import { BlockSelector } from './editor/BlockSelector';
import { BlockSelector as HtmlBlockSelector } from './editor/BlockHtmlSelector';
import { Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import ListItem from '@tiptap/extension-list-item';
import Dropcursor from '@tiptap/extension-dropcursor';
import Document from '@tiptap/extension-document';
import { useAutoSave } from '../hooks/useAutoSave';
import { autoSaveService } from '../services/autoSaveService';
import { useIdleDetection } from '../hooks/useIdleDetection';

// Импорт стилей из внешних файлов
import './editor/styles/editorStyles.css';
import './editor/styles/blockStyles.css';

// Инициализация lowlight для подсветки синтаксиса
const lowlightPlugin = createLowlight(common);

// Интерфейс для компонента меню блока
interface BlockMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  editor: Editor;
}

// Модальное окно для выбора блока
const BlockMenu = ({ isOpen, onClose, position, editor }: BlockMenuProps) => {
  if (!isOpen) return null;

  const handleAddBlock = (type: string) => {
    // Добавляем выбранный тип блока
    switch(type) {
      case 'heading1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'heading3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'taskList':
        editor.chain().focus().toggleTaskList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'codeBlock':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'horizontalRule':
        editor.chain().focus().setHorizontalRule().run();
        break;
      case 'table':
        editor.chain().focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
        break;
      case 'image':
        const url = window.prompt('URL изображения');
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
        break;
      default:
        break;
    }
    onClose();
  };

  return (
    <div 
      className="block-menu"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 50,
      }}
    >
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2 py-1">
            Блоки
          </h3>
          
          <div className="grid grid-cols-1 gap-1 mt-1">
            <button 
              className="flex items-center text-left rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleAddBlock('heading1')}
            >
              <span className="text-xl font-bold">H1</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Заголовок 1</span>
            </button>
            
            <button 
              className="flex items-center text-left rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleAddBlock('heading2')}
            >
              <span className="text-lg font-bold">H2</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Заголовок 2</span>
            </button>
            
            <button 
              className="flex items-center text-left rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleAddBlock('heading3')}
            >
              <span className="text-base font-bold">H3</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Заголовок 3</span>
            </button>

            <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>
            
            <button 
              className="flex items-center text-left rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleAddBlock('bulletList')}
            >
              <span className="text-lg">•</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Маркированный список</span>
            </button>
            
            <button 
              className="flex items-center text-left rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleAddBlock('orderedList')}
            >
              <span className="text-lg">1.</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Нумерованный список</span>
            </button>
            
            <button 
              className="flex items-center text-left rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleAddBlock('taskList')}
            >
              <span className="text-lg">☐</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Список задач</span>
            </button>

            <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>
            
            <button 
              className="flex items-center text-left rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleAddBlock('blockquote')}
            >
              <span className="text-lg">"</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Цитата</span>
            </button>
            
            <button 
              className="flex items-center text-left rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleAddBlock('codeBlock')}
            >
              <span className="text-lg">{`</>`}</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Блок кода</span>
            </button>

            <button 
              className="flex items-center text-left rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleAddBlock('horizontalRule')}
            >
              <span className="text-lg">—</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Горизонтальная линия</span>
            </button>

            <button 
              className="flex items-center text-left rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleAddBlock('table')}
            >
              <span className="text-lg">⊞</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Таблица</span>
            </button>
            
            <button 
              className="flex items-center text-left rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleAddBlock('image')}
            >
              <span className="text-lg">🖼️</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Изображение</span>
            </button>
          </div>
        </div>
      </div>
      
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
    </div>
  );
};

// Создаем расширение для работы с новой строкой и меню блока
const NewLineHandling = Extension.create({
  name: 'newLineHandling',
  
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { selection } = this.editor.state;
        const { $anchor, empty } = selection;
        
        // Если курсор находится в пустом параграфе, создаем новый пустой
        if (empty && $anchor.parent.type.name === 'paragraph' && $anchor.parent.textContent === '') {
          return this.editor.chain().focus().createParagraphNear().run();
        }
        
        // Если курсор находится в конце параграфа (не пустого), также создаем новый параграф
        if ($anchor.pos === $anchor.end() && !empty) {
          return this.editor.chain().focus().createParagraphNear().run();
        }
        
        // Иначе просто новая строка
        return false;
      }
    };
  },
  
  // Добавляем обработку автоматического создания новой строки при достижении конца документа
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleClick: (view, pos, event) => {
            // Определяем, что клик произошел за последним содержимым (в пустой области редактора)
            const { state } = view;
            const docSize = state.doc.content.size;
            
            // Если клик после последнего содержимого документа
            if (pos >= docSize - 2) {
              // Создаем новый пустой параграф и устанавливаем курсор
              this.editor.chain()
                .insertContentAt(docSize - 1, '<p></p>')
                .focus(docSize + 1)
                .run();
                
              return true;
            }
            
            return false;
          }
        }
      })
    ];
  }
});

// Добавляем новое расширение для обработки CSS классов в HTML
const AllowClassesOnNodes = Extension.create({
  name: 'allowClassesOnNodes',
  
  addGlobalAttributes() {
    return [
      {
        types: [
          'paragraph',
          'heading',
          'blockquote',
          'bulletList',
          'orderedList',
          'listItem',
          'codeBlock',
          'horizontalRule',
          'image',
        ],
        attributes: {
          class: {
            default: null,
          },
          style: {
            default: null,
          },
          id: {
            default: null,
          },
        },
      },
      {
        types: ['div', 'span'],
        attributes: {
          class: {
            default: null,
          },
          style: {
            default: null,
          },
          id: {
            default: null,
          },
        },
      },
    ];
  },
});

interface RichTextEditorProps {
  content: string;
  onSave: (targetFolderId?: string | null, fileName?: string) => void;
  onChange: (value: string) => void;
  title?: string;
  withBackground?: boolean;
  format?: 'html' | 'markdown';
  itemId?: string;
  onEdit?: () => void;
  isEditing?: boolean;
  autoSave?: boolean;
  fileType?: string;
}

// Расширяем интерфейс для пользовательских событий
interface CustomEventMap {
  'block-menu-open': CustomEvent<{
    x: number;
    y: number;
    position: number;
  }>;
}

declare global {
  interface WindowEventMap extends CustomEventMap {}
}

// Расширяем типы команд TipTap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    insertStyledHtmlBlock: {
      /**
       * Вставляет HTML блок с сохранением стилей
       */
      insertStyledHtmlBlock: (html: string) => ReturnType;
    };
  }
}

export function RichTextEditor({
  content,
  onSave,
  onChange,
  title,
  withBackground = true,
  format = 'html',
  itemId,
  onEdit,
  isEditing = true,
  autoSave = true,
  fileType = 'article'
}: RichTextEditorProps) {
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [blockSelectorPosition, setBlockSelectorPosition] = useState({ x: 0, y: 0 });
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);
  const floatingButtonRef = useRef<HTMLButtonElement>(null);
  const editorContentRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  // Состояние для отображения меню блока (4 точек)
  const [showHtmlBlockSelector, setShowHtmlBlockSelector] = useState(false);
  const [htmlBlockSelectorPosition, setHtmlBlockSelectorPosition] = useState({ x: 0, y: 0 });
  
  // Состояние автосохранения и его индикация
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Состояние для текущего контента и флаг изменений
  const [currentContent, setCurrentContent] = useState(content);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState<string>(content);
  
  // Инициализация автосохранения
  const { isSaving, saveError, forceSave, lastSaveResult } = useAutoSave(
    currentContent,
    async (contentToSave: string, id?: string) => {
      // Используем глобальный сервис автосохранения
      console.log(`Автосохранение ${fileType} с ID ${id || itemId}`);
      return autoSaveService.saveItem(fileType, contentToSave, id || itemId);
    },
    400, // задержка 400 мс
    false, // отключаем автоматический запуск, будем управлять через idle detection
    itemId
  );
  
  // Сбрасываем флаг изменений при успешном сохранении
  useEffect(() => {
    if (lastSaveResult) {
      setHasChanges(false);
      setLastSavedContent(currentContent); // Обновляем последний сохраненный контент
    }
  }, [lastSaveResult, currentContent]);
  
  // Определяем функцию для сохранения при бездействии
  const handleIdleSave = useCallback(() => {
    if (autoSave && itemId && hasChanges && !isSaving) {
      // Сравниваем текущий контент с последним сохраненным, чтобы избежать избыточных сохранений
      if (JSON.stringify(currentContent) !== JSON.stringify(lastSavedContent)) {
        console.log('Автосохранение контента');
        forceSave().then(() => {
          setHasChanges(false);
        }).catch(error => {
          console.error('Ошибка при автосохранении:', error);
        });
      } else {
        // Если контент не изменился, просто сбрасываем флаг изменений
        setHasChanges(false);
      }
    }
  }, [autoSave, itemId, hasChanges, isSaving, forceSave, currentContent, lastSavedContent]);
  
  // Инициализация обнаружения бездействия
  const { isIdle } = useIdleDetection(
    800, // Увеличиваем задержку до 800мс для предотвращения слишком частых сохранений
    handleIdleSave, // вызываем сохранение при бездействии
    ['keydown'] // Отслеживаем ТОЛЬКО нажатия клавиш, НЕ события мыши
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4'
          }
        },
        code: {
          HTMLAttributes: {
            class: 'bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 font-mono'
          }
        },
        codeBlock: false,
        paragraph: {
          HTMLAttributes: ({ node }: { node: { content: { size: number } } }) => ({
            class: `text-gray-900 dark:text-gray-100 leading-normal ${node.content.size === 0 ? 'is-empty' : ''}`,
          }),
        }
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          // Не показываем плейсхолдер, так как мы используем CSS
          return '';
        },
        emptyEditorClass: 'is-editor-empty',
        emptyNodeClass: 'is-empty',
        showOnlyWhenEditable: true,
        includeChildren: true,
      }),
      NewLineHandling,
      CodeBlockLowlight.configure({
        lowlight: lowlightPlugin,
        HTMLAttributes: {
          class: 'bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono my-4'
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 hover:underline'
        }
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4'
        }
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b dark:border-gray-700'
        }
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border-b-2 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-bold p-2 text-left'
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border dark:border-gray-700 p-2'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'text-orange-500 dark:text-orange-400 bg-transparent',
        }
      }),
      Typography,
      Underline,
      Subscript,
      Superscript,
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose pl-0'
        }
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'flex items-start my-2'
        },
        nested: true
      }),
      AllowClassesOnNodes,
    ],
    content,
    editable: true,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      
      // Проверяем, что содержимое действительно изменилось
      if (html !== currentContent) {
        console.log('Содержимое изменено:', html.substring(0, 50) + '...');
        setCurrentContent(html); // Обновляем локальное состояние
        setHasChanges(true); // Отмечаем, что есть изменения
        onChange(html); // Уведомляем родительский компонент
      }
    },
    autofocus: 'end',
  });

  // Сохраняем содержимое при обновлении props
  useEffect(() => {
    if (editor) {
      const editorContent = editor.getHTML();
      
      // Обновляем содержимое при любом изменении content или itemId, включая очистку content
      // Обновляем также, если контент стал пустым (при выборе пустого файла)
      if (editorContent !== content || (content === '' && editorContent !== '<p></p>')) {
        console.log('Обновление содержимого редактора из-за изменения props content');
        editor.commands.setContent(content || '<p></p>');
        // Сбрасываем состояние редактора при смене файла
        setCurrentContent(content);
        setLastSavedContent(content);
        setHasChanges(false);
      }
    }
  }, [content, itemId, editor]);

  // Обновляем локальное состояние, когда извне приходит новый контент
  useEffect(() => {
    // Даже если есть изменения, но контент полностью изменился (сменился файл),
    // всё равно обновляем локальное состояние
    const contentChanged = content !== currentContent;
    const isContentReset = !content && currentContent; // Обрабатываем случай, когда content стал пустым
    
    if (contentChanged && (isContentReset || !hasChanges)) {
      setCurrentContent(content);
      setLastSavedContent(content);
      setHasChanges(false);
    }
  }, [content, currentContent, hasChanges]);

  // Обновляем статус автосохранения
  useEffect(() => {
    if (isSaving) {
      setAutoSaveState('saving');
    } else if (saveError) {
      setAutoSaveState('error');
      console.error('Ошибка автосохранения:', saveError);
    } else if (autoSaveState === 'saving') {
      setAutoSaveState('saved');
      // Сбрасываем статус "saved" через 2 секунды
      const timer = setTimeout(() => {
        setAutoSaveState('idle');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, saveError, autoSaveState]);

  // Добавляем обработчик события выделения текста и клика на иконку
  useEffect(() => {
    if (!editor || !editorContentRef.current) return;

    // Функция для определения координат выделения
    const handleSelectionChange = () => {
      if (editor.view.hasFocus() && !editor.state.selection.empty) {
        // Получаем текущее выделение
        const { from, to } = editor.state.selection;
        
        // Если есть выделение
        if (from !== to) {
          try {
            const view = editor.view;
            
            // Получаем DOM-селекцию для более точного позиционирования
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Используем rect для получения точных координат выделенного текста
            const centerX = rect.left + rect.width / 2;
            
            // Вычисляем отступ от верха выделения (сразу над текстом)
            const topOffset = rect.top - 94; // 65px над текстом
            
            // Устанавливаем координаты для отображения панели
            setSelectionCoords({ 
              x: centerX, 
              y: topOffset
            });
          } catch (error) {
            console.error('Error getting selection coordinates:', error);
            setSelectionCoords(null);
          }
        }
      } else {
        // Если нет выделения, скрываем панель
        setSelectionCoords(null);
      }
    };

    // Обработчик клика на иконку меню (4 точек) перед параграфом
    const handleEditorClick = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const target = mouseEvent.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      
      // Определяем, был ли клик на иконке меню (перед параграфом)
      // Проверяем позицию клика относительно левого края параграфа
      if (target.tagName === 'P' && mouseEvent.clientX < rect.left && mouseEvent.clientX > rect.left - 30) {
        // Находим позицию ноды в редакторе
        const pos = editor.view.posAtDOM(target, 0);
        if (pos !== null) {
          // Устанавливаем выделение на этот параграф
          editor.commands.setTextSelection(pos);
          
          // Открываем HtmlBlockSelector вместо BlockSelector
          setHtmlBlockSelectorPosition({ 
            x: rect.left, 
            y: rect.top 
          });
          setShowHtmlBlockSelector(true);
          
          mouseEvent.preventDefault();
          mouseEvent.stopPropagation();
        }
      }
    };

    // Комбинированный обработчик для события клика
    const handleCombinedClick = (e: Event) => {
      // Убираем setTimeout и вызываем напрямую
      handleSelectionChange();
      handleEditorClick(e);
    };

    // Добавляем слушатель события selectionchange
    document.addEventListener('selectionchange', handleSelectionChange);
    
    // Добавляем слушатель клика для проверки выделения и для клика на иконке 4 точек
    const editorEl = editorContentRef.current.querySelector('.ProseMirror');
    editorEl?.addEventListener('click', handleCombinedClick);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      const editorEl = editorContentRef.current?.querySelector('.ProseMirror');
      editorEl?.removeEventListener('click', handleCombinedClick);
    };
  }, [editor]);

  // Фокус на последний пустой параграф при монтировании
  useEffect(() => {
    if (editor) {
      editor.setEditable(true);
      
      // Проверяем, пуст ли редактор
      if (editor.isEmpty) {
        // Добавляем начальный пустой параграф, если редактор пуст
        editor.commands.setContent('<p></p>');
        editor.commands.focus('end');
      }
    }
  }, [editor]); // Только при изменении самого editor

  const handleExportPDF = () => {
    if (!editor) return;

    const element = document.createElement('div');
    element.className = 'prose max-w-none p-8';
    element.style.color = '#000000';
    
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      * {
        color: #000000 !important;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #000000 !important;
        margin-bottom: 1em;
      }
      p {
        color: #000000 !important;
        margin-bottom: 0.5em;
      }
      a {
        color: #2563eb !important;
        text-decoration: underline;
      }
    `;
    element.appendChild(styleElement);
    
    const titleElement = document.createElement('h1');
    titleElement.style.fontSize = '24px';
    titleElement.style.fontWeight = 'bold';
    titleElement.style.marginBottom = '24px';
    titleElement.style.color = '#000000';
    titleElement.textContent = title || 'Документ';
    
    element.appendChild(titleElement);
    
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = editor.getHTML();
    element.appendChild(contentDiv);

    const documentTitle = title || 'document';
    const opt = {
      margin: 10,
      filename: `${documentTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  const handleOpenBlockSelector = () => {
    // Открываем обычный BlockSelector для кнопки "+"
    setBlockSelectorPosition({
      x: Math.max(100, window.innerWidth - 300),
      y: Math.max(100, window.innerHeight - 400)
    });
    setShowBlockSelector(true);
  };

  // Функция для обработки вставки HTML блоков с сохранением стилей
  const insertStyledHtmlBlock = (editor: Editor, html: string): boolean => {
    try {
      // Преобразование HTML в DOM
      const div = document.createElement('div');
      div.innerHTML = html;
      
      // Применение дополнительной обработки, если необходимо
      // Например, можно добавить дополнительные стили или атрибуты
      
      // Вставка HTML с сохранением всех атрибутов и стилей
      editor.commands.insertContent({
        type: 'doc',
        content: [
          {
            type: 'html',
            content: [
              {
                type: 'text',
                text: html,
              },
            ],
          },
        ],
      });
      
      return true;
    } catch (error) {
      console.error('Ошибка при вставке стилизованного HTML блока:', error);
      return false;
    }
  };
  
  // Заменяем функцию insertContent в BlockSelector
  useEffect(() => {
    if (editor) {
      // Предоставляем функцию insertStyledHtmlBlock через API редактора
      editor.commands.insertStyledHtmlBlock = (html: string) => insertStyledHtmlBlock(editor, html);
    }
  }, [editor]);

  // Перед размонтированием компонента принудительно сохраняем изменения
  useEffect(() => {
    return () => {
      // Если есть несохраненные изменения, сохраняем их
      if (autoSave && itemId && hasChanges && !isSaving) {
        forceSave().catch(err => console.error('Ошибка окончательного сохранения:', err));
      }
    };
  }, [autoSave, itemId, hasChanges, isSaving, forceSave]);

  return (
    <div className={withBackground ? "bg-white dark:bg-gray-800 rounded-xl p-8" : ""}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>

      <div className="relative">
        {editor && selectionCoords && (
          <div 
            ref={toolbarRef}
            className="floating-toolbar"
            style={{
              position: 'fixed',
              top: `${selectionCoords.y}px`,
              left: `${selectionCoords.x}px`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <Toolbar editor={editor} />
          </div>
        )}

        <div 
          className="prose dark:prose-invert max-w-none" 
          ref={editorContentRef}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {editor && (
        <>
          <BlockSelector
            editor={editor}
            isOpen={showBlockSelector}
            onClose={() => setShowBlockSelector(false)}
            position={blockSelectorPosition}
          />
          
          <HtmlBlockSelector
            editor={editor}
            isOpen={showHtmlBlockSelector}
            onClose={() => setShowHtmlBlockSelector(false)}
            position={htmlBlockSelectorPosition}
          />
        </>
      )}
    </div>
  );
}
