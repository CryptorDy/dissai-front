import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Folder, FileText, GraduationCap, BookOpen, FileQuestion, MessageCircle, Target, Instagram } from 'lucide-react';
import { KnowledgeItem } from '../services/api';

interface ArticleSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (article: KnowledgeItem) => void;
  items: KnowledgeItem[];
  selectedArticleId?: string | null;
}

export function ArticleSelectorDialog({ isOpen, onClose, onSelect, items, selectedArticleId }: ArticleSelectorDialogProps) {
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

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const isExpanded = prev.includes(id);
      if (isExpanded) {
        return prev.filter(folderId => folderId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'educational':
        return <GraduationCap className="w-4 h-4 mr-2 text-green-500" />;
      case 'notes':
        return <BookOpen className="w-4 h-4 mr-2 text-purple-500" />;
      case 'chat':
        return <MessageCircle className="w-4 h-4 mr-2 text-pink-500" />;
      case 'simplify':
        return <FileQuestion className="w-4 h-4 mr-2 text-red-500" />;
      case 'roadmap-item':
        return <Target className="w-4 h-4 mr-2 text-orange-500" />;
      case 'reels':
        return <Instagram className="w-4 h-4 mr-2 text-rose-500" />;
      default:
        return <FileText className="w-4 h-4 mr-2 text-blue-500" />;
    }
  };

  const findAllParentFolders = (items: KnowledgeItem[], targetId: string): string[] => {
    const parents: string[] = [];

    const findParent = (items: KnowledgeItem[], targetId: string): boolean => {
      for (const item of items) {
        if (item.type === 'folder' && item.children) {
          if (item.children.some(child => child.id === targetId)) {
            parents.push(item.id);
            return true;
          }
          if (findParent(item.children, targetId)) {
            parents.push(item.id);
            return true;
          }
        }
      }
      return false;
    };

    findParent(items, targetId);
    return parents;
  };

  // Автоматически раскрываем папки, содержащие выбранную статью
  React.useEffect(() => {
    if (selectedArticleId) {
      const parentFolders = findAllParentFolders(items, selectedArticleId);
      setExpandedFolders(prev => [...new Set([...prev, ...parentFolders])]);
    }
  }, [selectedArticleId, items]);

  const renderItem = (item: KnowledgeItem, level = 0) => {
    const isExpanded = expandedFolders.includes(item.id);
    const isSelected = item.id === selectedArticleId;

    return (
      <div key={item.id}>
        <button
          className={`w-full group flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer text-left ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.id);
            } else if (item.type === 'file') {
              onSelect(item);
            }
          }}
        >
          {item.type === 'folder' && (
            <ChevronRight
              className={`w-4 h-4 mr-2 transition-transform text-gray-400 dark:text-gray-300 ${isExpanded ? 'transform rotate-90' : ''}`}
            />
          )}
          {item.type === 'folder' ? (
            <Folder className="w-4 h-4 mr-2 text-blue-500" />
          ) : (
            getFileIcon(item.fileType)
          )}
          <span className={`flex-1 truncate ${
            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
          }`}>
            {item.name}
          </span>
        </button>
        {item.type === 'folder' && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        ref={dialogRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Выберите статью
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1">
            {items.map(item => renderItem(item))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
