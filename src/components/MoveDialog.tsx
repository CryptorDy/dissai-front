import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Folder, Plus } from 'lucide-react';
import { KnowledgeItem } from '../services/api';

interface MoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetFolderId: string | null, newFileName?: string) => void;
  items: KnowledgeItem[];
  currentItem: KnowledgeItem;
}

export function MoveDialog({ isOpen, onClose, onMove, items, currentItem }: MoveDialogProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');
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

  const renderFolderOption = (item: KnowledgeItem, level = 0) => {
    if (item.id === currentItem.id || (item.type === 'folder' && item.id === currentItem.parentId)) {
      return null }

    // Если текущий элемент - Reels, показываем только папки и файлы типа Reels
    if (currentItem.fileType === 'reels' && item.type === 'file' && item.fileType !== 'reels') {
      return null;
    }

    return (
      <div key={item.id}>
        {item.type === 'folder' && (
          <button
            onClick={() => setSelectedFolder(item.id)}
            className={`w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center ${
              selectedFolder === item.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          >
            <Folder className="w-4 h-4 mr-2 text-blue-500" />
            <span className="text-gray-900 dark:text-white">{item.name}</span>
          </button>
        )}
        {item.type === 'folder' && item.children?.map(child => renderFolderOption(child, level + 1))}
        {/* Показываем файлы только если это Reels и текущий элемент тоже Reels */}
        {currentItem.fileType === 'reels' && item.type === 'file' && item.fileType === 'reels' && (
          <button
            onClick={() => setSelectedFolder(item.id)}
            className={`w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center ${
              selectedFolder === item.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          >
            <span className="text-gray-900 dark:text-white">{item.name}</span>
          </button>
        )}
      </div>
    );
  };

  const handleSubmit = () => {
    if (showNewFileInput && !newFileName.trim()) {
      return;
    }
    
    // Передаем имя новой статьи, если оно есть
    if (showNewFileInput && newFileName.trim()) {
      onMove(selectedFolder, newFileName.trim());
    } else {
      onMove(selectedFolder);
    }
    
    setShowNewFileInput(false);
    setNewFileName('');
  };

  // Проверяем, является ли выбранный элемент статьей типа Reels
  const isSelectedItemReelsArticle = () => {
    if (!selectedFolder) return false;
    
    // Рекурсивно ищем элемент по ID
    const selectedItem = findItemById(items, selectedFolder);
    return selectedItem?.type === 'file' && selectedItem?.fileType === 'reels';
  };

  // Кнопка активна только если:
  // 1. Для Reels: выбрана существующая статья Reels или введено имя новой статьи
  // 2. Для не-Reels элементов: всегда активна
  const isSubmitEnabled = () => {
    if (currentItem.fileType === 'reels') {
      if (selectedFolder === null) {
        // Для корневой папки нужно имя новой статьи
        return showNewFileInput && newFileName.trim().length > 0;
      } else {
        const selectedItem = findItemById(items, selectedFolder);
        // Для папки нужно имя новой статьи, для статьи Reels - не нужно
        if (selectedItem?.type === 'folder') {
          return showNewFileInput && newFileName.trim().length > 0;
        } else {
          return selectedItem?.type === 'file' && selectedItem?.fileType === 'reels';
        }
      }
    }
    return true; // Для не-Reels элементов всегда активна
  };

  // Рекурсивно ищем элемент по ID
  const findItemById = (items: KnowledgeItem[], id: string): KnowledgeItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children && item.children.length > 0) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {currentItem.fileType === 'reels' ? 'Переместить Reels' : 'Сохранить в папке'}
        </h3>
        <div className="max-h-96 overflow-y-auto mb-4">
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

        {currentItem.fileType === 'reels' && (
          <div className="mb-4">
            {(selectedFolder === null || (selectedFolder && findItemById(items, selectedFolder)?.type === 'folder')) && (
              <>
                <button
                  onClick={() => setShowNewFileInput(!showNewFileInput)}
                  className="w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center text-blue-600 dark:text-blue-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Создать новую статью</span>
                </button>
                {showNewFileInput && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="Введите название статьи..."
                      className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isSubmitEnabled()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Переместить
          </button>
        </div>
      </motion.div>
    </div>
  );
}
