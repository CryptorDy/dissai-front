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
import { common, createLowlight } from 'lowlight';
import { Edit2, FileDown, Eye, Plus } from 'lucide-react';
import { Toolbar } from './editor/Toolbar';
import { BlockSelector } from './editor/BlockSelector';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onChange: (value: string) => void;
  title?: string;
  withBackground?: boolean;
  format?: 'html' | 'markdown';
  itemId?: string;
}

export function RichTextEditor({
  content,
  isEditing,
  onEdit,
  onSave,
  onChange,
  title = 'Редактор',
  withBackground = true,
  format = 'html',
  itemId
}: RichTextEditorProps) {
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [blockSelectorPosition, setBlockSelectorPosition] = useState({ x: 0, y: 0 });
  const floatingButtonRef = useRef<HTMLButtonElement>(null);

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
          HTMLAttributes: {
            class: 'text-gray-900 dark:text-gray-100 leading-normal'
          }
        }
      }),
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
    editable: isEditing,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    }
  });

  useEffect(() => {
    if (editor && !isEditing) {
      editor.setEditable(false);
    } else if (editor && isEditing) {
      editor.setEditable(true);
    }
  }, [content, isEditing, editor]);

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditing ? `Редактирование: ${title}` : title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title={isEditing ? 'Просмотр' : 'Редактировать'}
          >
            {isEditing ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
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
        {isEditing && editor && (
          <Toolbar editor={editor} />
        )}

        <div className="prose dark:prose-invert max-w-none">
          <EditorContent editor={editor} />
        </div>

        {isEditing && (
          <div className="h-[52px]" />
        )}
      </div>

      {isEditing && (
        <button
          ref={floatingButtonRef}
          onClick={handleOpenBlockSelector}
          className="fixed bottom-8 right-8 p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          title="Добавить блок"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {isEditing && editor && (
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
