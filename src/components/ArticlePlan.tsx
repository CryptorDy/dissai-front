import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, AlertCircle } from 'lucide-react';

interface Chapter {
  title: string;
  note: string;
}

interface ArticlePlanProps {
  chapters: Chapter[];
  onChapterChange: (index: number, field: 'title' | 'note', value: string) => void;
  onGenerate: () => void;
  onMarkdownChange: (markdown: string) => void;
}

interface DeleteDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  chapterTitle: string;
}

function DeleteDialog({ isOpen, onConfirm, onCancel, chapterTitle }: DeleteDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4"
      >
        <div className="flex items-center mb-4 text-red-500">
          <AlertCircle className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Подтверждение удаления</h3>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Вы уверены, что хотите удалить главу "{chapterTitle}"?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Удалить
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ArticlePlan({ chapters, onChapterChange, onGenerate, onMarkdownChange }: ArticlePlanProps) {
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; index: number; title: string }>({
    isOpen: false,
    index: -1,
    title: ''
  });

  const addChapter = () => {
    const newChapters = [
      ...chapters,
      { title: `Глава ${chapters.length + 1}`, note: '' }
    ];
    generateMarkdown(newChapters);
  };

  const handleDeleteClick = (index: number, title: string) => {
    setDeleteDialog({
      isOpen: true,
      index,
      title
    });
  };

  const handleDeleteConfirm = () => {
    const newChapters = chapters.filter((_, i) => i !== deleteDialog.index);
    generateMarkdown(newChapters);
    setDeleteDialog({ isOpen: false, index: -1, title: '' });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, index: -1, title: '' });
  };

  const generateMarkdown = (updatedChapters: Chapter[]) => {
    let markdown = '### План статьи\n\n';
    updatedChapters.forEach((chapter) => {
      markdown += `- **${chapter.title}**\n`;
      if (chapter.note) {
        markdown += `  ${chapter.note}\n`;
      }
    });
    onMarkdownChange(markdown);
  };

  const handleChapterUpdate = (index: number, field: 'title' | 'note', value: string) => {
    onChapterChange(index, field, value);
    const updatedChapters = chapters.map((chapter, i) => {
      if (i === index) {
        return { ...chapter, [field]: value };
      }
      return chapter;
    });
    generateMarkdown(updatedChapters);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            План статьи
          </h2>
          <button
            onClick={addChapter}
            className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3 mb-6">
          {chapters.map((chapter, index) => (
            <div
              key={index}
              className={`
                relative border-l-4 transition-all duration-200
                ${expandedChapter === index
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-700'
                }
              `}
            >
              <div className="relative pl-4">
                <div className="flex items-start justify-between gap-4">
                  <input
                    type="text"
                    value={chapter.title}
                    onChange={(e) => handleChapterUpdate(index, 'title', e.target.value)}
                    className={`
                      flex-1 text-lg font-medium bg-transparent border-0 focus:ring-0 p-2 rounded-lg
                      ${expandedChapter === index
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                      }
                    `}
                    placeholder={`Глава ${index + 1}`}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedChapter(expandedChapter === index ? null : index)}
                      className={`
                        p-2 rounded-lg transition-colors
                        ${expandedChapter === index
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-400'
                        }
                      `}
                    >
                      {expandedChapter === index ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(index, chapter.title)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {expandedChapter === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-2 pb-4"
                  >
                    <textarea
                      value={chapter.note}
                      onChange={(e) => handleChapterUpdate(index, 'note', e.target.value)}
                      placeholder="Добавьте заметки к главе..."
                      className="w-full p-3 mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onGenerate}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          Сгенерировать статью
        </button>
      </motion.div>

      <AnimatePresence>
        {deleteDialog.isOpen && (
          <DeleteDialog
            isOpen={deleteDialog.isOpen}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
            chapterTitle={deleteDialog.title}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
