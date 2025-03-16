import React, { useState } from 'react';
import { NavigationMenu } from '../../components/NavigationMenu';
import { RichTextEditor } from '../../components/RichTextEditor';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import { Search, Upload, Languages, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Paper {
  id: string;
  title: string;
  description: string;
  language: string;
}

function SimplifyArticle() {
  const [mode, setMode] = useState<'file' | 'search'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPapers([
        {
          id: '1',
          title: 'Квантовая запутанность в многомерных системах',
          description: 'В данной работе исследуются фундаментальные аспекты квантовой запутанности в многомерных системах. Рассматриваются различные методы измерения степени запутанности и их применение в квантовых вычислениях. Особое внимание уделяется проблеме декогеренции и методам её минимизации.',
          language: 'ru'
        },
        {
          id: '2',
          title: 'Quantum Entanglement in Higher Dimensional Systems',
          description: 'This paper investigates fundamental aspects of quantum entanglement in higher dimensional systems. Various methods for measuring entanglement degree and their application in quantum computing are discussed. Special attention is paid to the problem of decoherence and methods for its minimization.',
          language: 'en'
        }
      ]);
    } catch (error) {
      console.error('Error searching papers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleTranslate = async (paper: Paper) => {
    setIsLoading(true);
    try {
      // Имитация API запроса перевода
      await new Promise(resolve => setTimeout(resolve, 1000));
      const translatedPaper = {
        ...paper,
        title: paper.language === 'en' ? 'Квантовая запутанность в многомерных системах' : 'Quantum Entanglement in Higher Dimensional Systems',
        description: paper.language === 'en' 
          ? 'В данной работе исследуются фундаментальные аспекты квантовой запутанности в многомерных системах. Рассматриваются различные методы измерения степени запутанности и их применение в квантовых вычислениях. Особое внимание уделяется проблеме декогеренции и методам её минимизации.'
          : 'This paper investigates fundamental aspects of quantum entanglement in higher dimensional systems. Various methods for measuring entanglement degree and their application in quantum computing are discussed. Special attention is paid to the problem of decoherence and methods for its minimization.',
        language: paper.language === 'en' ? 'ru' : 'en'
      };
      setPapers(prev => prev.map(p => p.id === paper.id ? translatedPaper : p));
    } catch (error) {
      console.error('Error translating paper:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimplify = async () => {
    if (!selectedPaper && !file) return;

    setIsLoading(true);
    try {
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 2000));
      setContent(`# ${selectedPaper?.title || file?.name}

## Краткое содержание

Это упрощенная версия научной работы, написанная простым и понятным языком...

## Основные идеи

1. Первая ключевая идея
2. Вторая ключевая идея
3. Третья ключевая идея

## Практическое применение

...`);
    } catch (error) {
      console.error('Error simplifying content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    const finalContent = isEditing ? editableContent : content;
    const blob = new Blob([finalContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simplified-paper.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleEditMode = () => {
    if (!isEditing) {
      setEditableContent(content);
    } else {
      setContent(editableContent);
    }
    setIsEditing(!isEditing);
  };

  const renderContent = () => {
    if (content) {
      return (
        <div className="max-w-6xl mx-auto">
          <RichTextEditor
            content={isEditing ? editableContent : content}
            isEditing={isEditing}
            onEdit={toggleEditMode}
            onSave={handleSave}
            onChange={setEditableContent}
            title="Упрощенная версия"
          />
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="flex gap-4 mb-8">
          {[
            { id: 'search' as const, label: 'Поиск работы' },
            { id: 'file' as const, label: 'Загрузка файла' }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setMode(option.id)}
              className={`flex-1 p-4 rounded-lg border transition-colors ${
                mode === option.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {mode === 'search' ? (
          <div>
            <form onSubmit={handleSearch} className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Введите название или тему научной работы..."
                  className="w-full p-4 pr-12 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {isLoading ? (
              <LoadingAnimation />
            ) : (
              <AnimatePresence>
                {papers.map((paper) => (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`relative p-4 rounded-lg border mb-4 cursor-pointer transition-colors ${
                      selectedPaper?.id === paper.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                    onClick={() => setSelectedPaper(paper)}
                  >
                    {paper.language !== 'ru' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTranslate(paper);
                        }}
                        className="absolute top-2 right-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400"
                      >
                        <Languages className="w-4 h-4" />
                      </button>
                    )}
                    <div className="pr-12">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {paper.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-[15]">
                        {paper.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-6 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <Upload className="w-5 h-5 mr-2 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">
                {file ? file.name : 'Выберите файл'}
              </span>
            </label>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              PDF, DOC, DOCX или TXT
            </p>
          </div>
        )}

        {(selectedPaper || file) && (
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSimplify}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="mr-2">Пересказать простым языком</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <NavigationMenu />
      <div className="max-w-3xl mx-auto px-4 py-12">
        {renderContent()}
      </div>
    </div>
  );
}

export default SimplifyArticle;
