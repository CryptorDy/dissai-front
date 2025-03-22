import React, { useEffect, useRef, useCallback } from 'react';
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
  FolderIcon
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
  // Ссылка на инпут, чтобы сфокусироваться на нем при появлении
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Функция для обработки клика по элементу
  const handleItemClick = useCallback((item: KnowledgeItem) => {
    // Проверяем, имеет ли элемент временный ID
    if (item.id.startsWith('temp-')) {
      console.log('КFS: Выбран элемент с временным ID:', item.id);
    }
    
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
        return <FileIcon className="w-4 h-4 mr-2 text-blue-500" strokeWidth={1.5} />;
      case 'educational':
        return <GraduationCap className="w-4 h-4 mr-2 text-green-500" strokeWidth={1.5} />;
      case 'notes':
        return <BookOpen className="w-4 h-4 mr-2 text-purple-500" strokeWidth={1.5} />;
      case 'roadmap-item':
        return <Target className="w-4 h-4 mr-2 text-orange-500" strokeWidth={1.5} />;
      case 'chat':
        return <MessageCircle className="w-4 h-4 mr-2 text-pink-500" strokeWidth={1.5} />;
      case 'simplify':
        return <FileQuestion className="w-4 h-4 mr-2 text-red-500" strokeWidth={1.5} />;
      case 'reels':
        return <Instagram className="w-4 h-4 mr-2 text-rose-500" strokeWidth={1.5} />;
      case 'content-plan':
        return <Calendar className="w-4 h-4 mr-2 text-teal-500" strokeWidth={1.5} />;
      default:
        return <FileIcon className="w-4 h-4 mr-2 text-gray-500" strokeWidth={1.5} />;
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
    const isExpanded = expandedFolders.includes(item.id);
    
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
          className={`group flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer ${
            selected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={() => {
            if (item.itemType === 'folder' || hasChildren) {
              onToggleFolder(item.id);
            }
            
            handleItemClick(item);
          }}
          onContextMenu={(e) => onContextMenu(e, item)}
        >
          {/* Отображаем стрелку раскрытия для папок и файлов с дочерними элементами */}
          {(item.itemType === 'folder' || hasChildren) && (
            <div className="relative flex items-center justify-center w-5 mr-1">
              <ChevronRight
                className={`w-4 h-4 transition-transform text-gray-400 dark:text-gray-300 ${isExpanded ? 'transform rotate-90' : ''}`}
                strokeWidth={1.5}
              />
            </div>
          )}
          {item.itemType === 'folder' ? (
            <FolderIcon className="w-4 h-4 mr-2 text-blue-500" strokeWidth={1.5} />
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
            <span className="flex-1 text-gray-900 dark:text-white">{displayName}</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, item);
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 p-1.5 rounded-full transition-all"
          >
            <MoreVertical className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
          </button>
        </div>
        {/* Отображаем дочерние элементы для папок и файлов, если они есть и раскрыты */}
        {isExpanded && hasChildren && item.children && (
          <div>
            {item.children.filter(child => child && child.id).map(child => renderItem(child, level + 1))}
          </div>
        )}
      </React.Fragment>
    );
  }, [expandedFolders, isEditing, editName, onToggleFolder, onSelectItem, onContextMenu, isItemSelected, handleItemClick]);

  return (
    <div className="w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex flex-col border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Файлы</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onAddFile}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <FilePlus className="w-5 h-5 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
            </button>
            <button
              onClick={onAddFolder}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <FolderPlus className="w-5 h-5 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {Array.isArray(items) && items.filter(item => item && item.id).map(item => renderItem(item))}
        </div>
      </div>
    </div>
  );
}
