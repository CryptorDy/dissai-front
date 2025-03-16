import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  List, 
  Quote, 
  Code, 
  Link2, 
  Strikethrough, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3, 
  Table as TableIcon, 
  Image as ImageIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Underline, 
  Superscript, 
  Subscript, 
  Highlighter, 
  ListChecks, 
  ArrowUpToLine,
  ArrowDownToLine,
  Trash2,
  ArrowLeftToLine,
  ArrowRightToLine,
  TableProperties
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: () => boolean;
  isActive?: () => boolean;
}

export function Toolbar({ editor }: ToolbarProps) {
  const [showTableControls, setShowTableControls] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const mainControls: ToolbarButton[] = [
    { icon: <Bold className="w-4 h-4" />, label: 'Жирный', action: () => editor.chain().focus().toggleBold().run(), isActive: () => editor.isActive('bold') },
    { icon: <Italic className="w-4 h-4" />, label: 'Курсив', action: () => editor.chain().focus().toggleItalic().run(), isActive: () => editor.isActive('italic') },
    { icon: <Underline className="w-4 h-4" />, label: 'Подчеркнутый', action: () => editor.chain().focus().toggleUnderline().run(), isActive: () => editor.isActive('underline') },
    { icon: <Strikethrough className="w-4 h-4" />, label: 'Зачеркнутый', action: () => editor.chain().focus().toggleStrike().run(), isActive: () => editor.isActive('strike') },
    { icon: <Code className="w-4 h-4" />, label: 'Код', action: () => editor.chain().focus().toggleCode().run(), isActive: () => editor.isActive('code') },
    { icon: <Superscript className="w-4 h-4" />, label: 'Верхний индекс', action: () => editor.chain().focus().toggleSuperscript().run(), isActive: () => editor.isActive('superscript') },
    { icon: <Subscript className="w-4 h-4" />, label: 'Нижний индекс', action: () => editor.chain().focus().toggleSubscript().run(), isActive: () => editor.isActive('subscript') },
    { icon: <Highlighter className="w-4 h-4" />, label: 'Выделение', action: () => editor.chain().focus().toggleHighlight().run(), isActive: () => editor.isActive('highlight') }
  ];

  const headingControls: ToolbarButton[] = [
    { icon: <Heading1 className="w-4 h-4" />, label: 'H1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor.isActive('heading', { level: 1 }) },
    { icon: <Heading2 className="w-4 h-4" />, label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor.isActive('heading', { level: 2 }) },
    { icon: <Heading3 className="w-4 h-4" />, label: 'H3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => editor.isActive('heading', { level: 3 }) }
  ];

  const listControls: ToolbarButton[] = [
    { icon: <List className="w-4 h-4" />, label: 'Маркированный список', action: () => editor.chain().focus().toggleBulletList().run(), isActive: () => editor.isActive('bulletList') },
    { icon: <ListOrdered className="w-4 h-4" />, label: 'Нумерованный список', action: () => editor.chain().focus().toggleOrderedList().run(), isActive: () => editor.isActive('orderedList') },
    { icon: <ListChecks className="w-4 h-4" />, label: 'Список задач', action: () => editor.chain().focus().toggleTaskList().run(), isActive: () => editor.isActive('taskList') }
  ];

  const alignmentControls: ToolbarButton[] = [
    { icon: <AlignLeft className="w-4 h-4" />, label: 'По левому краю', action: () => editor.chain().focus().setTextAlign('left').run(), isActive: () => editor.isActive({ textAlign: 'left' }) },
    { icon: <AlignCenter className="w-4 h-4" />, label: 'По центру', action: () => editor.chain().focus().setTextAlign('center').run(), isActive: () => editor.isActive({ textAlign: 'center' }) },
    { icon: <AlignRight className="w-4 h-4" />, label: 'По правому краю', action: () => editor.chain().focus().setTextAlign('right').run(), isActive: () => editor.isActive({ textAlign: 'right' }) },
    { icon: <AlignJustify className="w-4 h-4" />, label: 'По ширине', action: () => editor.chain().focus().setTextAlign('justify').run(), isActive: () => editor.isActive({ textAlign: 'justify' }) }
  ];

  const tableControls = [
    { label: 'Добавить строку сверху', icon: <ArrowUpToLine className="w-4 h-4" />, action: () => editor.chain().focus().addRowBefore().run() },
    { label: 'Добавить строку снизу', icon: <ArrowDownToLine className="w-4 h-4" />, action: () => editor.chain().focus().addRowAfter().run() },
    { label: 'Удалить строку', icon: <Trash2 className="w-4 h-4" />, action: () => editor.chain().focus().deleteRow().run() },
    { label: 'Добавить столбец слева', icon: <ArrowLeftToLine className="w-4 h-4" />, action: () => editor.chain().focus().addColumnBefore().run() },
    { label: 'Добавить столбец справа', icon: <ArrowRightToLine className="w-4 h-4" />, action: () => editor.chain().focus().addColumnAfter().run() },
    { label: 'Удалить столбец', icon: <Trash2 className="w-4 h-4" />, action: () => editor.chain().focus().deleteColumn().run() },
    { label: 'Удалить таблицу', icon: <TableProperties className="w-4 h-4" />, action: () => {
      editor.chain().focus().deleteTable().run();
      setShowTableControls(false);
    }}
  ];

  const handleImageUpload = () => {
    const url = window.prompt('Введите URL изображения:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const handleTableClick = () => {
    if (!editor.isActive('table')) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
    setShowTableControls(!showTableControls);
  };

  const renderToolbarButton = ({ icon, label, action, isActive }: ToolbarButton) => (
    <button
      key={label}
      onClick={() => action()}
      className={`p-2 rounded-lg transition-colors ${
        isActive?.()
          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg mb-4 sticky top-0 z-50">
      <div className="flex flex-wrap items-center gap-1 p-2">
        <div className="flex items-center gap-1">
          {mainControls.map(renderToolbarButton)}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

        <div className="flex items-center gap-1">
          {headingControls.map(renderToolbarButton)}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

        <div className="flex items-center gap-1">
          {listControls.map(renderToolbarButton)}
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded-lg transition-colors ${
              editor.isActive('blockquote')
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Цитата"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

        <div className="flex items-center gap-1">
          {alignmentControls.map(renderToolbarButton)}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

        <div className="flex items-center gap-1">
          <button
            onClick={handleTableClick}
            className={`p-2 rounded-lg transition-colors ${
              showTableControls
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Таблица"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          <button
            onClick={handleImageUpload}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Изображение"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowLinkInput(!showLinkInput)}
            className={`p-2 rounded-lg transition-colors ${
              editor.isActive('link')
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Ссылка"
          >
            <Link2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showTableControls && editor.isActive('table') && (
        <div className="p-2 bg-gray-50 dark:bg-gray-900 flex flex-wrap gap-2 rounded-lg">
          {tableControls.map(({ label, icon, action }) => (
            <button
              key={label}
              onClick={action}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>
      )}

      {showLinkInput && (
        <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <form onSubmit={handleLinkSubmit} className="flex gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Добавить
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl('');
              }}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
            >
              Отмена
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
