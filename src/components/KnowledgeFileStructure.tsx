import React, { useEffect, useRef, useCallback, useState } from 'react';
import { 
  ChevronRight, 
  MoreVertical, 
  FilePlus,
  FolderPlus,
  GraduationCap,
  BookOpen,
  Target,
  FileQuestion,
  MessageCircle,
  Instagram,
  Calendar,
  FileIcon,
  FolderIcon,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ArrowLeftRight
} from 'lucide-react';
import { KnowledgeItem } from '../services/api';

interface KnowledgeFileStructureProps {
  items: KnowledgeItem[];
  selectedItem: KnowledgeItem | null;
  expandedFolders: string[];
  isEditing: string | null;
  editName: string;
  onToggleFolder: (id: string) => void;
  onSelectItem: (item: KnowledgeItem) => void;
  onContextMenu: (e: React.MouseEvent, item: KnowledgeItem) => void;
  onEditNameChange: (value: string) => void;
  onEditSave: (item: KnowledgeItem) => void;
  onAddFile: () => void;
  onAddFolder: () => void;
}

export function KnowledgeFileStructure({
  items = [],
  selectedItem,
  expandedFolders,
  isEditing,
  editName,
  onToggleFolder,
  onSelectItem,
  onContextMenu,
  onEditNameChange,
  onEditSave,
  onAddFile,
  onAddFolder
}: KnowledgeFileStructureProps) {
  // Значения ширины в пикселях
  const defaultWidth = 240; // Ширина по умолчанию (60 в tailwind примерно равно 240px)
  const minWidth = 200; // Минимальная ширина панели
  
  // Устанавливаем начальную ширину из localStorage или используем значение по умолчанию
  const [width, setWidth] = useState(() => {
    const savedWidth = localStorage.getItem('knowledgePanelWidth');
    return savedWidth ? parseInt(savedWidth) : defaultWidth;
  });
  
  // Состояние для отслеживания процесса ресайза
  const [isResizing, setIsResizing] = useState(false);
  
  // Ссылка на инпут, чтобы сфокусироваться на нем при появлении
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentWidthRef = useRef(width);

  // Инициализация CSS-переменной при монтировании и изменении ширины
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.setProperty('--panel-width', `${width}px`);
      currentWidthRef.current = width;
    }
  }, [width]);

  // Обработчик начала перетаскивания
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    currentWidthRef.current = width;
    setIsResizing(true);
    
    // Добавляем класс для блокировки плавной анимации при перетаскивании
    if (panelRef.current) {
      panelRef.current.classList.add('resizing');
    }
  }, [width]);

  // Оптимизированный обработчик перетаскивания
  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;
      
      // Вычисляем новую ширину напрямую, без изменения состояния React
      const deltaX = e.clientX - startXRef.current;
      let newWidth = currentWidthRef.current + deltaX;
      
      // Ограничения
      if (newWidth < minWidth) newWidth = minWidth;
      const maxWidth = window.innerWidth * 0.3;
      if (newWidth > maxWidth) newWidth = maxWidth;
      
      // Напрямую устанавливаем CSS-переменную для мгновенного обновления
      // без перерисовки React-компонента
      panelRef.current.style.setProperty('--panel-width', `${newWidth}px`);
    };

    const stopResizing = () => {
      if (!isResizing || !panelRef.current) return;
      
      // Удаляем класс для включения плавной анимации после перетаскивания
      panelRef.current.classList.remove('resizing');
      
      // После завершения перетаскивания обновляем React state
      // для сохранения нового значения ширины
      const currentWidth = panelRef.current.getBoundingClientRect().width;
      setWidth(currentWidth);
      localStorage.setItem('knowledgePanelWidth', currentWidth.toString());
      setIsResizing(false);
    };

    if (isResizing) {
      // Для максимальной плавности используем passive event listener
      document.addEventListener('mousemove', handleResize, { passive: true });
      document.addEventListener('mouseup', stopResizing);
      
      // Добавляем класс для предотвращения выделения текста при перетаскивании
      document.body.classList.add('resize-cursor');
    }

    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResizing);
      document.body.classList.remove('resize-cursor');
    };
  }, [isResizing, minWidth]);

  // Эффект для фокуса на инпуте при редактировании
  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Небольшая задержка для корректной работы фокуса
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Выделяем весь текст при фокусе
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isEditing]);

  // Сохраняем ширину при размонтировании компонента
  useEffect(() => {
    return () => {
      localStorage.setItem('knowledgePanelWidth', width.toString());
    };
  }, [width]);

  // Функция для обработки клика по элементу
  const handleItemClick = useCallback((item: KnowledgeItem) => {
    // Передаем выбранный элемент родительскому компоненту
    // Если это папка, она будет только выбрана, но содержимое не будет отображаться
    onSelectItem(item);
  }, [onSelectItem]);
  
  // Функция для проверки, является ли элемент выбранным
  const isItemSelected = useCallback((itemId: string): boolean => {
    // Проверяем, имеет ли элемент временный ID и выбран ли он
    if (itemId.startsWith('temp-') && selectedItem?.id?.startsWith('temp-')) {
      console.log('KFS: Сравнение временных ID:', itemId, selectedItem.id);
    }
    
    return itemId === selectedItem?.id;
  }, [selectedItem]);

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'article':
        return <FileIcon className="w-3.5 h-3.5 mr-1.5 text-blue-500" strokeWidth={1.5} />;
      case 'educational':
        return <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-green-500" strokeWidth={1.5} />;
      case 'notes':
        return <BookOpen className="w-3.5 h-3.5 mr-1.5 text-purple-500" strokeWidth={1.5} />;
      case 'roadmap-item':
        return <Target className="w-3.5 h-3.5 mr-1.5 text-orange-500" strokeWidth={1.5} />;
      case 'chat':
        return <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-pink-500" strokeWidth={1.5} />;
      case 'simplify':
        return <FileQuestion className="w-3.5 h-3.5 mr-1.5 text-red-500" strokeWidth={1.5} />;
      case 'reels':
        return <Instagram className="w-3.5 h-3.5 mr-1.5 text-rose-500" strokeWidth={1.5} />;
      case 'content-plan':
        return <Calendar className="w-3.5 h-3.5 mr-1.5 text-teal-500" strokeWidth={1.5} />;
      default:
        return <FileIcon className="w-3.5 h-3.5 mr-1.5 text-gray-500" strokeWidth={1.5} />;
    }
  };

  const renderItem = useCallback((item: KnowledgeItem, level: number = 0) => {
    // Проверяем, имеет ли элемент временный ID при рендеринге
    if (item.id.startsWith('temp-')) {
      console.log('КFS: Рендеринг элемента с временным ID:', item.id, 'выбранный ID:', selectedItem?.id);
    }
    
    // Защита от ошибок с undefined id
    if (!item || !item.id) {
      return null;
    }
    
    // Проверяем, является ли папка развернутой
    const isExpandedFolder = expandedFolders.includes(item.id);
    
    // Проверяем, является ли элемент выбранным
    const selected = isItemSelected(item.id);
    
    const isItemEditing = isEditing === item.id;
    const isTemporary = item.id.startsWith('temp-');
    // Изменяем логику определения отображаемого имени для временных элементов
    let displayName = item.name || "";
    if (isTemporary && !item.name) {
      // Определяем тип временного элемента по префиксу ID только если имя пустое
      if (item.id.startsWith('temp-folder-')) {
        displayName = "Новая папка";
      } else {
        displayName = "Новый файл";
      }
    } else {
      displayName = item.name || "Без имени";
    }
    // Проверяем, есть ли у элемента дочерние элементы
    const hasChildren = item.children && item.children.length > 0;

    return (
      <React.Fragment key={item.id}>
        <div
          className={`group flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer ${
            selected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          } truncate`}
          style={{ paddingLeft: `${level * 0.75 + 0.5}rem` }}
          onClick={() => {
            // Для папок только переключаем раскрытие, но не выбираем как активный элемент
            if (item.itemType === 'folder') {
              onToggleFolder(item.id);
            } else {
              // Только для файлов вызываем обработчик выбора элемента
              handleItemClick(item);
            }
          }}
          onContextMenu={(e) => onContextMenu(e, item)}
        >
          {/* Отображаем стрелку раскрытия для папок и файлов с дочерними элементами */}
          {(item.itemType === 'folder' || hasChildren) && (
            <div 
              className="relative flex items-center justify-center w-4 mr-1"
              onClick={(e) => {
                e.stopPropagation(); // Предотвращаем всплытие события
                onToggleFolder(item.id);
              }}
            >
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform text-gray-400 dark:text-gray-300 ${isExpandedFolder ? 'transform rotate-90' : ''}`}
                strokeWidth={1.5}
              />
            </div>
          )}
          {item.itemType === 'folder' ? (
            <FolderIcon className="w-3.5 h-3.5 mr-1.5 text-blue-500" strokeWidth={1.5} />
          ) : (
            getFileIcon(item.fileType)
          )}
          {isItemEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onBlur={() => onEditSave(item)}
              onKeyDown={(e) => e.key === 'Enter' && onEditSave(item)}
              className="flex-1 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              placeholder="Введите имя файла"
              autoFocus
            />
          ) : (
            <span className="flex-1 text-gray-900 dark:text-white truncate">
              {displayName}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, item);
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded-full transition-all"
          >
            <MoreVertical className="w-3 h-3 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
          </button>
        </div>
        {/* Отображаем дочерние элементы для папок и файлов, если они есть и раскрыты */}
        {isExpandedFolder && hasChildren && item.children && (
          <div>
            {item.children.filter(child => child && child.id).map(child => renderItem(child, level + 1))}
          </div>
        )}
      </React.Fragment>
    );
  }, [expandedFolders, isEditing, editName, onToggleFolder, onSelectItem, onContextMenu, isItemSelected, handleItemClick]);

  return (
    <div 
      ref={panelRef} 
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex flex-col border-r border-gray-200 dark:border-gray-700 relative will-change-transform panel-resize text-base"
      style={{ width: 'var(--panel-width)' }}
    >
      <style>
        {`
          .panel-resize {
            transition: width 0.1s cubic-bezier(0.25, 1, 0.5, 1);
          }
          .panel-resize.resizing {
            transition: none !important;
          }
          .resize-cursor, .resize-cursor * {
            cursor: ew-resize !important;
            user-select: none !important;
          }
        `}
      </style>
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Файлы</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onAddFile}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              title="Добавить файл"
            >
              <FilePlus className="w-4 h-4 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
            </button>
            <button
              onClick={onAddFolder}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              title="Добавить папку"
            >
              <FolderPlus className="w-4 h-4 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-3">
        <div className="space-y-0.5">
          {Array.isArray(items) && items.filter(item => item && item.id).map(item => renderItem(item))}
        </div>
      </div>
      
      {/* Ручка для изменения размера панели с двунаправленной стрелкой */}
      <div 
        className="absolute top-0 right-0 bottom-0 w-px bg-gray-200 dark:bg-gray-600 hover:bg-blue-400/80 cursor-ew-resize transition-colors z-10"
        onMouseDown={startResizing}
        title="Изменить ширину панели"
      >
        <div className="absolute top-1/2 -translate-y-1/2 right-0 h-6 w-6 flex items-center justify-center -mr-3 bg-white dark:bg-gray-700 rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
          <ArrowLeftRight className="w-3 h-3 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
        </div>
        {isResizing && (
          <div className="fixed inset-0 z-50 cursor-ew-resize" />
        )}
      </div>
    </div>
  );
}
