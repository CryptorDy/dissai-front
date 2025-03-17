import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Youtube } from 'lucide-react';
import { NavigationMenu } from '../../components/NavigationMenu';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import { RichTextEditor } from '../../components/RichTextEditor';

type SourceType = 'text' | 'file' | 'youtube' | 'link';

interface FormData {
  title: string;
  sourceType: SourceType;
  text: string;
  file: File | null;
  link: string;
}

interface ValidationErrors {
  title?: string;
  text?: string;
  file?: string;
  link?: string;
}

function NotesArticle() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    sourceType: 'text',
    text: '',
    file: null,
    link: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    }

    switch (formData.sourceType) {
      case 'text':
        if (!formData.text.trim()) {
          newErrors.text = 'Текст обязателен';
        }
        break;
      case 'file':
        if (!formData.file) {
          newErrors.file = 'Файл обязателен';
        }
        break;
      case 'youtube':
      case 'link':
        if (!formData.link.trim()) {
          newErrors.link = 'Ссылка обязательна';
        } else if (!isValidUrl(formData.link)) {
          newErrors.link = 'Некорректная ссылка';
        } else if (formData.sourceType === 'youtube' && !isValidYoutubeUrl(formData.link)) {
          newErrors.link = 'Некорректная ссылка на YouTube';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidYoutubeUrl = (url: string): boolean => {
    return url.includes('youtube.com/watch?v=') || url.includes('youtu.be/');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/plain' && file.type !== 'application/pdf') {
        setErrors({ ...errors, file: 'Поддерживаются только TXT и PDF файлы' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setErrors({ ...errors, file: 'Размер файла не должен превышать 10MB' });
        return;
      }
      setFormData({ ...formData, file });
      setErrors({ ...errors, file: undefined });
    }
  };

  const handleSave = () => {
    if (!generatedContent && !editableContent) return;

    const content = isEditing ? editableContent : generatedContent;
    const blob = new Blob([content || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.title || 'конспект'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleEditMode = () => {
    if (!isEditing) {
      setEditableContent(generatedContent || '');
    } else {
      setGeneratedContent(editableContent);
    }
    setIsEditing(!isEditing);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Здесь будет логика отправки данных на сервер
      // Пока что имитируем задержку и возвращаем моковый результат
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockContent = `# ${formData.title}

## Основные тезисы

1. Первый важный тезис из материала
2. Второй ключевой момент
3. Третье основное положение

## Детальный разбор

### Раздел 1
Подробное описание первого раздела...

### Раздел 2
Углубленный анализ второго раздела...

## Заключение

Краткое обобщение основных идей и выводов.`;

      setGeneratedContent(mockContent);
    } catch (error) {
      console.error('Ошибка при генерации конспекта:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSourceInput = () => {
    switch (formData.sourceType) {
      case 'text':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Текст
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => {
                setFormData({ ...formData, text: e.target.value });
                if (errors.text) {
                  setErrors({ ...errors, text: undefined });
                }
              }}
              className={`w-full p-3 rounded-lg border ${
                errors.text 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-200 dark:border-gray-700'
              } bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-[200px]`}
              placeholder="Вставьте текст для конспекта..."
            />
            {errors.text && (
              <p className="text-sm text-red-500">{errors.text}</p>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Файл (TXT или PDF, до 10MB)
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center px-4 py-2 rounded-lg border ${
                  errors.file
                    ? 'border-red-500 dark:border-red-500 text-red-500'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                <Upload className="w-5 h-5 mr-2" />
                Выбрать файл
              </button>
              {formData.file && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.file.name}
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {errors.file && (
              <p className="text-sm text-red-500">{errors.file}</p>
            )}
          </div>
        );

      case 'youtube':
      case 'link':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {formData.sourceType === 'youtube' ? 'Ссылка на YouTube' : 'Ссылка на статью'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {formData.sourceType === 'youtube' ? (
                  <Youtube className="w-5 h-5 text-gray-400" />
                ) : (
                  <LinkIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => {
                  setFormData({ ...formData, link: e.target.value });
                  if (errors.link) {
                    setErrors({ ...errors, link: undefined });
                  }
                }}
                className={`w-full pl-10 p-3 rounded-lg border ${
                  errors.link
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                } bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white`}
                placeholder={
                  formData.sourceType === 'youtube'
                    ? 'https://www.youtube.com/watch?v=...'
                    : 'https://...'
                }
              />
            </div>
            {errors.link && (
              <p className="text-sm text-red-500">{errors.link}</p>
            )}
          </div>
        );
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingAnimation />;
    }

    if (generatedContent) {
      return (
        <RichTextEditor
          content={isEditing ? editableContent : generatedContent}
          isEditing={isEditing}
          onEdit={toggleEditMode}
          onSave={handleSave}
          onChange={setEditableContent}
          title={formData.title || 'Конспект'}
        />
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Создание конспекта
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Название
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) {
                    setErrors({ ...errors, title: undefined });
                  }
                }}
                className={`w-full p-3 rounded-lg border ${
                  errors.title
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                } bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white`}
                placeholder="Введите название конспекта..."
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Источник
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'text', label: 'Текст' },
                  { id: 'file', label: 'Файл' },
                  { id: 'youtube', label: 'YouTube' },
                  { id: 'link', label: 'Ссылка' }
                ].map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, sourceType: source.id as SourceType })}
                    className={`p-3 rounded-lg border ${
                      formData.sourceType === source.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                  >
                    {source.label}
                  </button>
                ))}
              </div>
            </div>

            {renderSourceInput()}

            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Сгенерировать конспект
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <NavigationMenu />
      <div className="max-w-6xl mx-auto px-4 py-12">
        {renderContent()}
      </div>
    </div>
  );
}

export default NotesArticle;
