import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationMenu } from '../../components/NavigationMenu';
import { RichTextEditor } from '../../components/RichTextEditor';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import { AlignLeft } from 'lucide-react';

const ARTICLE_LENGTHS = [
  { 
    id: 'short', 
    label: 'Короткий', 
    description: 'Базовый обзор',
    icon: <AlignLeft className="w-4 h-4" />
  },
  { 
    id: 'medium', 
    label: 'Средний', 
    description: 'Стандартный материал',
    icon: <AlignLeft className="w-5 h-5" />
  },
  { 
    id: 'long', 
    label: 'Длинный', 
    description: 'Углубленное изучение',
    icon: <AlignLeft className="w-6 h-6" />
  }
];

interface FormData {
  title: string;
  length: string;
  withTests: boolean;
  complexity: number;
}

interface ValidationErrors {
  title?: string;
}

function EducationalArticle() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    length: 'medium',
    withTests: true,
    complexity: 5
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

## Тестовые вопросы

1. Вопрос 1
   - [ ] Вариант A
   - [ ] Вариант B
   - [x] Вариант C
   - [ ] Вариант D

2. Вопрос 2
   - [ ] Вариант A
   - [x] Вариант B
   - [ ] Вариант C
   - [ ] Вариант D`;

      setContent(mockContent);
    } catch (error) {
      console.error('Ошибка при создании материала:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    const finalContent = isEditing ? editableContent : content;
    const blob = new Blob([finalContent || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.title || 'учебный-материал'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleEditMode = () => {
    if (!isEditing) {
      setEditableContent(content || '');
    } else {
      setContent(editableContent);
    }
    setIsEditing(!isEditing);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <LoadingAnimation />
      </div>
    );
  }

  if (content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
        <NavigationMenu onBack={() => setContent(null)} />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <RichTextEditor
            content={isEditing ? editableContent : content}
            isEditing={isEditing}
            onEdit={toggleEditMode}
            onSave={handleSave}
            onChange={setEditableContent}
            title={formData.title}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <NavigationMenu onBack={() => navigate('/articles')} />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Создание учебного материала
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Название материала
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
                placeholder="Введите название..."
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Длина материала
              </label>
              <div className="grid grid-cols-3 gap-4">
                {ARTICLE_LENGTHS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, length: l.id })}
                    className={`relative group flex items-center p-2 rounded-lg border transition-all ${
                      formData.length === l.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className={`flex-shrink-0 transition-colors ${
                      formData.length === l.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                    }`}>
                      {l.icon}
                    </div>
                    <div className="ml-3">
                      <div className={`text-sm font-medium transition-colors ${
                        formData.length === l.id
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {l.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {l.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Добавить тестирование
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.withTests}
                    onChange={(e) => setFormData({ ...formData, withTests: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {formData.withTests && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Сложность вопросов
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Простые</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.complexity}
                      onChange={(e) => setFormData({ ...formData, complexity: parseInt(e.target.value) })}
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Сложные</span>
                    <span className="w-8 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formData.complexity}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Создать материал
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EducationalArticle;
