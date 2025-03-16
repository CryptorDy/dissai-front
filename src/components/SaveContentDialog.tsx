import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Folder, Save, ChevronRight, FileText } from 'lucide-react';
import { KnowledgeItem } from '../services/api';

interface SaveContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (targetFolderId: string | null, fileName: string) => void;
  items: KnowledgeItem[];
  defaultFileName: string;
  contentType?: string;
  title?: string;
}

export function SaveContentDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  items, 
  defaultFileName,
  contentType = 'контент',
  title = 'Сохранить контент'
}: SaveContentDialogProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [fileName, setFileName] = useState(defaultFileName || 'Новый файл');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
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

  useEffect(() => {
    // При открытии диалога устанавливаем имя файла по умолчанию
    if (isOpen) {
      setFileName(defaultFileName || 'Новый файл');
    }
  }, [isOpen, defaultFileName]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      if (prev.includes(folderId)) {
        return prev.filter(id => id !== folderId);
      } else {
        return [...prev, folderId];
      }
    });
  };

  const renderFolderOption = (item: KnowledgeItem, level = 0) => {
    if (item.type !== 'folder') return null;

    const isExpanded = expandedFolders.includes(item.id);

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            setSelectedFolder(item.id);
            if (!isExpanded && item.children?.length) {
              toggleFolder(item.id);
            }
          }}
          className={`w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center ${
            selectedFolder === item.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        >
          {item.children && item.children.length > 0 && (
            <ChevronRight
              className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.id);
              }}
            />
          )}
          <Folder className="w-4 h-4 mr-2 text-blue-500" />
          <span className="text-gray-900 dark:text-white">{item.name}</span>
        </button>
        
        {isExpanded && item.children && (
          <div>
            {item.children.filter(child => child.type === 'folder').map(child => renderFolderOption(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = () => {
    if (!fileName.trim()) {
      return;
    }
    
    onSave(selectedFolder, fileName.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        ref={dialogRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
      >
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mr-3">
            <Save className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Название файла
          </label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            placeholder="Введите название файла..."
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Выберите папку
          </label>
          <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center ${
                selectedFolder === null ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <Folder className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-gray-900 dark:text-white">Корневая папка</span>
            </button>
            {items.map(item => renderFolderOption(item))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!fileName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Сохранить
          </button>
        </div>
      </motion.div>
    </div>
  );
}
