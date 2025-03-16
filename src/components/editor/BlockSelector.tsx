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
  X
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface BlockSelectorProps {
  editor: any;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

type BlockCategory = 'Все' | 'Основные' | 'Медиа' | 'Макеты' | 'Выноски' | 'Продвинутые';

interface Block {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: BlockCategory[];
  action: (editor: any) => void;
}

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
      icon: <FileText className="w-5 h-5" />,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().setParagraph().run();
        onClose();
      }
    },
    {
      id: 'heading1',
      title: 'Заголовок 1',
      description: 'Большой заголовок',
      icon: <span className="font-bold">H1</span>,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        onClose();
      }
    },
    {
      id: 'heading2',
      title: 'Заголовок 2',
      description: 'Средний заголовок',
      icon: <span className="font-bold">H2</span>,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        onClose();
      }
    },
    {
      id: 'heading3',
      title: 'Заголовок 3',
      description: 'Маленький заголовок',
      icon: <span className="font-bold">H3</span>,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        onClose();
      }
    },
    {
      id: 'bulletList',
      title: 'Маркированный список',
      description: 'Список с маркерами',
      icon: <List className="w-5 h-5" />,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleBulletList().run();
        onClose();
      }
    },
    {
      id: 'orderedList',
      title: 'Нумерованный список',
      description: 'Список с нумерацией',
      icon: <ListOrdered className="w-5 h-5" />,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleOrderedList().run();
        onClose();
      }
    },
    {
      id: 'taskList',
      title: 'Список задач',
      description: 'Список с чекбоксами',
      icon: <CheckSquare className="w-5 h-5" />,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleTaskList().run();
        onClose();
      }
    },
    {
      id: 'codeBlock',
      title: 'Блок кода',
      description: 'Блок для форматированного кода',
      icon: <Code className="w-5 h-5" />,
      category: ['Все', 'Продвинутые'],
      action: (editor) => {
        editor.chain().focus().toggleCodeBlock().run();
        onClose();
      }
    },
    {
      id: 'image',
      title: 'Изображение',
      description: 'Вставить изображение по URL',
      icon: <Image className="w-5 h-5" />,
      category: ['Все', 'Медиа'],
      action: (editor) => {
        const url = prompt('Введите URL изображения:');
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
        onClose();
      }
    },
    {
      id: 'table',
      title: 'Таблица',
      description: 'Вставить таблицу',
      icon: <Table className="w-5 h-5" />,
      category: ['Все', 'Макеты'],
      action: (editor) => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        onClose();
      }
    },
    {
      id: 'blockquote',
      title: 'Цитата',
      description: 'Блок для цитирования',
      icon: <Quote className="w-5 h-5" />,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().toggleBlockquote().run();
        onClose();
      }
    },
    {
      id: 'warning',
      title: 'Предупреждение',
      description: 'Блок с предупреждением',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      category: ['Все', 'Выноски'],
      action: (editor) => {
        editor.chain().focus().insertContent(`<div class="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 text-amber-700 dark:text-amber-300 my-4">
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
        </div>`).run();
        onClose();
      }
    },
    {
      id: 'info',
      title: 'Информация',
      description: 'Информационный блок',
      icon: <Info className="w-5 h-5 text-blue-500" />,
      category: ['Все', 'Выноски'],
      action: (editor) => {
        editor.chain().focus().insertContent(`<div class="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 my-4">
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
        </div>`).run();
        onClose();
      }
    },
    {
      id: 'success',
      title: 'Успех',
      description: 'Блок с сообщением об успехе',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      category: ['Все', 'Выноски'],
      action: (editor) => {
        editor.chain().focus().insertContent(`<div class="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-300 my-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium">Успешно</p>
              <p class="text-sm mt-1">Операция выполнена успешно.</p>
            </div>
          </div>
        </div>`).run();
        onClose();
      }
    },
    {
      id: 'divider',
      title: 'Разделитель',
      description: 'Горизонтальная линия',
      icon: <span className="w-5 h-0.5 bg-gray-400"></span>,
      category: ['Все', 'Основные'],
      action: (editor) => {
        editor.chain().focus().setHorizontalRule().run();
        onClose();
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

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={selectorRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg overflow-hidden"
        style={{ 
          maxHeight: '80vh'
        }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Вставить блок</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск блоков..."
              className="w-full p-2 pl-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="flex p-2">
            {(['Все', 'Основные', 'Медиа', 'Макеты', 'Выноски', 'Продвинутые'] as BlockCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1 text-sm rounded-md whitespace-nowrap ${
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
        
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 180px)' }}>
          <div className="grid grid-cols-2 gap-4 p-4">
            {filteredBlocks.map((block) => (
              <button
                key={block.id}
                onClick={() => block.action(editor)}
                className="flex flex-col items-start p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 mb-2 text-gray-700 dark:text-gray-300">
                  {block.icon}
                </div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{block.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{block.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
