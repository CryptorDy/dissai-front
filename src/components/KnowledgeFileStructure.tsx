import React from 'react';
import { 
  Folder, 
  FileText, 
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
  Calendar
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
  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'article':
        return <FileText className="w-4 h-4 mr-2 text-blue-500" />;
      case 'educational':
        return <GraduationCap className="w-4 h-4 mr-2 text-green-500" />;
      case 'notes':
        return <BookOpen className="w-4 h-4 mr-2 text-purple-500" />;
      case 'roadmap-item':
        return <Target className="w-4 h-4 mr-2 text-orange-500" />;
      case 'chat':
        return <MessageCircle className="w-4 h-4 mr-2 text-pink-500" />;
      case 'simplify':
        return <FileQuestion className="w-4 h-4 mr-2 text-red-500" />;
      case 'reels':
        return <Instagram className="w-4 h-4 mr-2 text-rose-500" />;
      case 'content-plan':
        return <Calendar className="w-4 h-4 mr-2 text-teal-500" />;
      default:
        return <FileText className="w-4 h-4 mr-2 text-gray-500" />;
    }
  };

  const renderItem = (item: KnowledgeItem, level = 0) => {
    const isExpanded = expandedFolders.includes(item.id);
    const isItemEditing = isEditing === item.id;

    return (
      <React.Fragment key={item.id}>
        <div
          className={`group flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer ${
            selectedItem?.id === item.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={() => {
            if (item.itemType === 'file') {
              onSelectItem(item);
            } else {
              onToggleFolder(item.id);
            }
          }}
          onContextMenu={(e) => onContextMenu(e, item)}
        >
          {item.itemType === 'folder' && (
            <ChevronRight
              className={`w-4 h-4 mr-2 transition-transform text-gray-400 dark:text-gray-300 ${isExpanded ? 'transform rotate-90' : ''}`}
            />
          )}
          {item.itemType === 'folder' ? (
            <Folder className="w-4 h-4 mr-2 text-blue-500" />
          ) : (
            getFileIcon(item.fileType)
          )}
          {isItemEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onBlur={() => onEditSave(item)}
              onKeyDown={(e) => e.key === 'Enter' && onEditSave(item)}
              className="flex-1 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              autoFocus
            />
          ) : (
            <span className="flex-1 text-gray-900 dark:text-white">{item.name}</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, item);
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded-full transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        {item.itemType === 'folder' && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex flex-col border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Файлы</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onAddFile}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <FilePlus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={onAddFolder}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <FolderPlus className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {Array.isArray(items) && items.map(item => renderItem(item))}
        </div>
      </div>
    </div>
  );
}
