import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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
import { Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Editor } from '@tiptap/core';

const lowlight = createLowlight(common);

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

// Добавляем стили для редактора
const editorStyles = `
.ProseMirror {
  min-height: 150px;
  outline: none;
  padding-bottom: 100px; /* Добавляем отступ снизу для удобства клика */
  padding-left: 24px; /* Уменьшаем отступ слева для меню блока */
}

/* Стили для параграфа с иконкой меню */
.ProseMirror p {
  position: relative;
  line-height: 1.5; /* Явно задаем высоту строки для предотвращения съезжания */
  margin: 0.5em 0; /* Стандартный отступ для параграфов */
}

/* Плейсхолдер для пустых параграфов */
.ProseMirror p.is-empty::after {
  content: 'Просто пишите...';
  color: #adb5bd;
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
  opacity: 0.6;
}

/* Создаем иконку меню через псевдоэлемент ТОЛЬКО для пустых параграфов */
.ProseMirror p.is-empty::before {
  content: '';
  position: absolute;
  left: -22px;
  top: 4px;
  width: 16px;
  height: 16px;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23adb5bd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='7' height='7'%3E%3C/rect%3E%3Crect x='14' y='3' width='7' height='7'%3E%3C/rect%3E%3Crect x='3' y='14' width='7' height='7'%3E%3C/rect%3E%3Crect x='14' y='14' width='7' height='7'%3E%3C/rect%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  z-index: 10; /* Убеждаемся, что иконка отображается поверх других элементов */
}

/* Показываем иконку при наведении только для пустых параграфов */
.ProseMirror p.is-empty:hover::before {
  opacity: 1;
}

/* Добавляем стиль для курсора на пустом месте редактора */
.ProseMirror-trailingBreak {
  cursor: text;
}

/* Стили для модального окна */
.block-menu {
  min-width: 220px;
  user-select: none;
}

/* Исправляем проблемы с отображением текста */
.ProseMirror h1, .ProseMirror h2, .ProseMirror h3, 
.ProseMirror ul, .ProseMirror ol, .ProseMirror blockquote {
  position: relative;
  margin: 1em 0;
}
`;

interface RichTextEditorProps {
  content: string;
  onSave: () => void;
  onChange: (value: string) => void;
  title?: string;
  withBackground?: boolean;
  format?: 'html' | 'markdown';
  itemId?: string;
  onEdit?: () => void;
  isEditing?: boolean;
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

export function RichTextEditor({
  content,
  onSave,
  onChange,
  title = 'Редактор',
  withBackground = true,
  format = 'html',
  itemId
}: RichTextEditorProps) {
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [blockSelectorPosition, setBlockSelectorPosition] = useState({ x: 0, y: 0 });
  const [showToolbar, setShowToolbar] = useState(false);
  const floatingButtonRef = useRef<HTMLButtonElement>(null);
  const editorContentRef = useRef<HTMLDivElement>(null);
  
  // Состояние для отображения меню блока (4 точек)
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 });

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
        lowlight,
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
      })
    ],
    content,
    editable: true,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    autofocus: 'end',
  });

  // Обработчик для делегирования событий и обработки кликов на иконку меню
  useEffect(() => {
    if (!editor || !editorContentRef.current) return;
    
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
          
          // Вместо BlockMenu открываем BlockSelector
          setBlockSelectorPosition({ 
            x: rect.left, 
            y: rect.top 
          });
          setShowBlockSelector(true);
          
          mouseEvent.preventDefault();
          mouseEvent.stopPropagation();
        }
      }
    };
    
    const editorEl = editorContentRef.current.querySelector('.ProseMirror');
    editorEl?.addEventListener('click', handleEditorClick);
    
    return () => {
      editorEl?.removeEventListener('click', handleEditorClick);
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
  }, [content, editor]);

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
    titleElement.textContent = title;
    
    element.appendChild(titleElement);
    
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = editor.getHTML();
    element.appendChild(contentDiv);

    const opt = {
      margin: 10,
      filename: `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  const handleOpenBlockSelector = () => {
    setShowBlockSelector(true);
  };

  return (
    <div className={withBackground ? "bg-white dark:bg-gray-800 rounded-xl p-8" : ""}>
      <style>{editorStyles}</style>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className={`p-2 ${showToolbar ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} rounded-lg hover:bg-blue-700 hover:text-white transition-colors`}
            title={showToolbar ? 'Скрыть панель форматирования' : 'Показать панель форматирования'}
          >
            {showToolbar ? <X className="w-4 h-4" /> : <Type className="w-4 h-4" />}
          </button>
          <button
            onClick={handleExportPDF}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Скачать PDF"
          >
            <FileDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        {editor && showToolbar && (
          <Toolbar editor={editor} />
        )}

        <div 
          className="prose dark:prose-invert max-w-none" 
          ref={editorContentRef}
        >
          <EditorContent editor={editor} />
        </div>

        {showToolbar && (
          <div className="h-[52px]" />
        )}
      </div>

      <button
        ref={floatingButtonRef}
        onClick={handleOpenBlockSelector}
        className="fixed bottom-8 right-8 p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
        title="Добавить блок"
      >
        <Plus className="w-6 h-6" />
      </button>

      {editor && (
        <BlockSelector
          editor={editor}
          isOpen={showBlockSelector}
          onClose={() => setShowBlockSelector(false)}
          position={blockSelectorPosition}
        />
      )}
    </div>
  );
}
