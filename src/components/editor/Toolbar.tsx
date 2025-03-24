import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  List, 
  Quote,
  Link2, 
  Strikethrough, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Underline, 
  Superscript, 
  Subscript, 
  Highlighter, 
  ListChecks,
  Image
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: () => boolean;
  isActive?: () => boolean;
  group?: string;
}

export function Toolbar({ editor }: ToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const mainControls: ToolbarButton[] = [
    { icon: <Bold className="w-4 h-4" />, label: 'Жирный', action: () => editor.chain().focus().toggleBold().run(), isActive: () => editor.isActive('bold'), group: 'main' },
    { icon: <Italic className="w-4 h-4" />, label: 'Курсив', action: () => editor.chain().focus().toggleItalic().run(), isActive: () => editor.isActive('italic'), group: 'main' },
    { icon: <Underline className="w-4 h-4" />, label: 'Подчеркнутый', action: () => editor.chain().focus().toggleUnderline().run(), isActive: () => editor.isActive('underline'), group: 'main' },
    { icon: <Strikethrough className="w-4 h-4" />, label: 'Зачеркнутый', action: () => editor.chain().focus().toggleStrike().run(), isActive: () => editor.isActive('strike'), group: 'main' }
  ];

  const advancedControls: ToolbarButton[] = [
    { icon: <Superscript className="w-4 h-4" />, label: 'Верхний индекс', action: () => editor.chain().focus().toggleSuperscript().run(), isActive: () => editor.isActive('superscript'), group: 'advanced' },
    { icon: <Subscript className="w-4 h-4" />, label: 'Нижний индекс', action: () => editor.chain().focus().toggleSubscript().run(), isActive: () => editor.isActive('subscript'), group: 'advanced' },
    { icon: <Highlighter className="w-4 h-4" />, label: 'Выделение', action: () => editor.chain().focus().toggleHighlight().run(), isActive: () => editor.isActive('highlight'), group: 'advanced' }
  ];

  const listControls: ToolbarButton[] = [
    { icon: <List className="w-4 h-4" />, label: 'Маркированный список', action: () => editor.chain().focus().toggleBulletList().run(), isActive: () => editor.isActive('bulletList'), group: 'list' },
    { icon: <ListOrdered className="w-4 h-4" />, label: 'Нумерованный список', action: () => editor.chain().focus().toggleOrderedList().run(), isActive: () => editor.isActive('orderedList'), group: 'list' },
    { icon: <ListChecks className="w-4 h-4" />, label: 'Список задач', action: () => editor.chain().focus().toggleTaskList().run(), isActive: () => editor.isActive('taskList'), group: 'list' }
  ];

  const alignmentControls: ToolbarButton[] = [
    { icon: <AlignLeft className="w-4 h-4" />, label: 'По левому краю', action: () => editor.chain().focus().setTextAlign('left').run(), isActive: () => editor.isActive({ textAlign: 'left' }), group: 'align' },
    { icon: <AlignCenter className="w-4 h-4" />, label: 'По центру', action: () => editor.chain().focus().setTextAlign('center').run(), isActive: () => editor.isActive({ textAlign: 'center' }), group: 'align' },
    { icon: <AlignRight className="w-4 h-4" />, label: 'По правому краю', action: () => editor.chain().focus().setTextAlign('right').run(), isActive: () => editor.isActive({ textAlign: 'right' }), group: 'align' },
    { icon: <AlignJustify className="w-4 h-4" />, label: 'По ширине', action: () => editor.chain().focus().setTextAlign('justify').run(), isActive: () => editor.isActive({ textAlign: 'justify' }), group: 'align' }
  ];

  const mediaControls: ToolbarButton[] = [
    { icon: <Image className="w-4 h-4" />, label: 'Изображение', action: () => {
      const url = window.prompt('URL изображения:');
      if (url) {
        return editor.chain().focus().setImage({ src: url }).run();
      }
      return false;
    }, group: 'media' }
  ];

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const renderToolbarButton = ({ icon, label, action, isActive }: ToolbarButton) => (
    <button
      key={label}
      onClick={() => action()}
      className={`p-1 rounded transition-colors ${
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
    <div className="rounded flex items-center flex-wrap gap-1 p-1">
      <div className="flex items-center gap-1">
        {mainControls.map(renderToolbarButton)}
      </div>

      <div className="flex items-center gap-1">
        {advancedControls.map(renderToolbarButton)}
      </div>

      <div className="flex items-center gap-1">
        {listControls.map(renderToolbarButton)}
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1 rounded transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Цитата"
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        {alignmentControls.map(renderToolbarButton)}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={`p-1 rounded transition-colors ${
            editor.isActive('link')
              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Ссылка"
        >
          <Link2 className="w-4 h-4" />
        </button>
        
        {mediaControls.map(renderToolbarButton)}
      </div>

      {showLinkInput && (
        <div className="p-1 rounded flex flex-1">
          <form onSubmit={handleLinkSubmit} className="flex gap-1 w-full">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
            >
              OK
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
