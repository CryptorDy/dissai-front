import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Type,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  SquareAsterisk,
  Image
} from 'lucide-react';

interface BlockSelectorProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

export function BlockSelector({ editor, isOpen, onClose, position }: BlockSelectorProps) {
  if (!isOpen) return null;

  const blocks = [
    {
      icon: <Heading1 className="w-4 h-4" />,
      label: 'Заголовок 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run()
    },
    {
      icon: <Heading2 className="w-4 h-4" />,
      label: 'Заголовок 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
      icon: <Heading3 className="w-4 h-4" />,
      label: 'Заголовок 3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
    {
      icon: <Type className="w-4 h-4" />,
      label: 'Параграф',
      action: () => editor.chain().focus().setParagraph().run()
    },
    {
      icon: <List className="w-4 h-4" />,
      label: 'Маркированный список',
      action: () => editor.chain().focus().toggleBulletList().run()
    },
    {
      icon: <ListOrdered className="w-4 h-4" />,
      label: 'Нумерованный список',
      action: () => editor.chain().focus().toggleOrderedList().run()
    },
    {
      icon: <ListChecks className="w-4 h-4" />,
      label: 'Список задач',
      action: () => editor.chain().focus().toggleTaskList().run()
    },
    {
      icon: <Quote className="w-4 h-4" />,
      label: 'Цитата',
      action: () => editor.chain().focus().toggleBlockquote().run()
    },
    {
      icon: <Code className="w-4 h-4" />,
      label: 'Код',
      action: () => editor.chain().focus().toggleCodeBlock().run()
    },
    {
      icon: <SquareAsterisk className="w-4 h-4" />,
      label: 'Разделитель',
      action: () => editor.chain().focus().setHorizontalRule().run()
    },
    {
      icon: <Image className="w-4 h-4" />,
      label: 'Изображение',
      action: () => {
        const url = window.prompt('Введите URL изображения:');
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    }
  ];

  const handleSelectBlock = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[200px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
          Вставить блок
        </h3>
        <div className="grid gap-1">
          {blocks.map((block) => (
            <button
              key={block.label}
              onClick={() => handleSelectBlock(block.action)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left text-sm"
            >
              {block.icon}
              <span>{block.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
