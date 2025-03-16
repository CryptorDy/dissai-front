import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  File, 
  FileText, 
  GraduationCap, 
  BookOpen, 
  Target, 
  FileQuestion,
  MessageCircle,
  FileEdit,
  Instagram,
  Calendar
} from 'lucide-react';

interface NewArticleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string, parentId?: string) => void;
  parentId?: string;
}

export function NewArticleDialog({ isOpen, onClose, onSelect, parentId }: NewArticleDialogProps) {
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

  // Определяем, какие типы файлов доступны
  const availableTypes = ['empty', 'roadmap-item', 'reels', 'content-plan'];

  const articleTypes = [
    { id: 'empty', label: 'Пустая статья', icon: <File className="w-4 h-4" />, description: 'Создайте статью с нуля' },
    { id: 'article', label: 'Статья', icon: <FileText className="w-4 h-4" />, description: 'Создайте статью с помощью AI', redirect: true },
    { id: 'educational', label: 'Учебный материал', icon: <GraduationCap className="w-4 h-4" />, description: 'Создайте обучающий материал с тестами' },
    { id: 'notes', label: 'Конспект', icon: <BookOpen className="w-4 h-4" />, description: 'Создайте конспект из текста или видео' },
    { id: 'content-plan', label: 'Контент-план', icon: <Calendar className="w-4 h-4" />, description: 'Создайте детальный план контента' },
    { id: 'roadmap-item', label: 'Roadmap', icon: <Target className="w-4 h-4" />, description: 'Создайте план развития', redirect: true },
    { id: 'chat', label: 'Чат', icon: <MessageCircle className="w-4 h-4" />, description: 'Создайте чат с AI' },
    { id: 'simplify', label: 'Пересказ научной работы', icon: <FileQuestion className="w-4 h-4" />, description: 'Упростите сложный текст' },
    { id: 'reels', label: 'Анализ Reels', icon: <Instagram className="w-4 h-4" />, description: 'Анализ Instagram Reels', redirect: true }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        ref={dialogRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Выберите тип контента
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {articleTypes.map((type) => {
            const isAvailable = availableTypes.includes(type.id);
            
            return (
              <button
                key={type.id}
                onClick={() => isAvailable && onSelect(type.id, parentId)}
                disabled={!isAvailable}
                className={`
                  flex flex-col items-start p-3 rounded-lg transition-colors
                  ${!isAvailable
                    ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }
                  h-full text-left
                `}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center
                      ${!isAvailable 
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400' 
                        : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      }
                    `}>
                      {type.icon}
                    </div>
                    <span className="ml-2 font-medium text-sm text-gray-900 dark:text-white">
                      {type.label}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Отмена
          </button>
        </div>
      </motion.div>
    </div>
  );
}
