import React, { useState, useEffect, useMemo } from 'react';
import { NavigationMenu } from '../../components/NavigationMenu';
import { ArticleCreationSteps } from '../../components/ArticleCreationSteps';
import { ArticlePlan } from '../../components/ArticlePlan';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import { articleApi, ArticleGenerationStep } from '../../services/articleApi';
import { knowledgeApi, KnowledgeItem } from '../../services/api';
import { SaveContentDialog } from '../../components/SaveContentDialog';
import { AlignLeft, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const ARTICLE_STYLES = [
  'Академический',
  'Публицистический',
  'Научно-популярный',
  'Художественный',
  'Технический'
];

const ARTICLE_LENGTHS = [
  { 
    id: 'short', 
    label: 'Короткая', 
    description: 'До 1000 слов',
    icon: <AlignLeft className="w-4 h-4" />
  },
  { 
    id: 'medium', 
    label: 'Средняя', 
    description: 'До 2000 слов',
    icon: <AlignLeft className="w-5 h-5" />
  },
  { 
    id: 'long', 
    label: 'Длинная', 
    description: 'До 3000 слов',
    icon: <AlignLeft className="w-6 h-6" />
  }
];

function RegularArticle() {
  const { showError } = useToast();
  const [currentView, setCurrentView] = useState<'initial' | ArticleGenerationStep | 'loading'>('initial');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [material, setMaterial] = useState('');
  const [style, setStyle] = useState(ARTICLE_STYLES[0]);
  const [length, setLength] = useState(ARTICLE_LENGTHS[1].id);
  const [chapters, setChapters] = useState([
    { title: 'Введение', note: '' },
    { title: 'Основная часть 1', note: '' },
    { title: 'Основная часть 2', note: '' },
    { title: 'Заключение', note: '' }
  ]);
  const [questions, setQuestions] = useState<Array<{ question: string; placeholder: string }>>([]);
  const [generatedArticle, setGeneratedArticle] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [articleTempId, setArticleTempId] = useState(`temp-article-${Date.now()}`);
  const [articleName, setArticleName] = useState<string>('');

  // Создаем memoized версию содержимого статьи,
  // которая не зависит от изменений articleTempId
  const articleContent = useMemo(() => {
    return isEditing ? editableContent : generatedArticle;
  }, [isEditing, editableContent, generatedArticle]);

  useEffect(() => {
    if (showSaveDialog) {
      setIsLoadingItems(true);
      knowledgeApi.getItems()
        .then(items => {
          setItems(items.filter(item => item.itemType === 'folder'));
          setIsLoadingItems(false);
        })
        .catch(error => {
          console.error('Failed to load folders:', error);
          showError('Ошибка при загрузке папок');
          setIsLoadingItems(false);
        });
    }
  }, [showSaveDialog, showError]);

  useEffect(() => {
    if (currentView === 'article' && generatedArticle) {
      setArticleTempId(`temp-article-${Date.now()}`);
    }
  }, [currentView, generatedArticle]);

  useEffect(() => {
    if (articleTempId && (editableContent || generatedArticle)) {
    }
  }, [articleTempId]);

  // Следим за изменениями в контенте и обновляем состояния
  useEffect(() => {
    if (articleContent) {
      // Если мы в режиме редактирования и контент изменился, обновляем editableContent
      if (isEditing && editableContent !== articleContent) {
        console.log('Обновление editableContent из articleContent');
        setEditableContent(articleContent);
      }
      // Если мы не в режиме редактирования и контент изменился, обновляем generatedArticle
      else if (!isEditing && generatedArticle !== articleContent) {
        console.log('Обновление generatedArticle из articleContent');
        setGeneratedArticle(articleContent);
      }
    }
  }, [articleContent, isEditing, editableContent, generatedArticle]);

  const handleInitialSubmit = async () => {
    setCurrentView('loading');
    try {
      const response = await articleApi.startGeneration({
        topic,
        material,
        style,
        length
      });
      
      if (response.step === 'questions' && response.data.questions) {
        setQuestions(response.data.questions);
        setAnswers(new Array(response.data.questions.length).fill(''));
      } else if (response.step === 'plan' && response.data.plan) {
        setChapters(response.data.plan);
      } else if (response.step === 'article' && response.data.article) {
        setGeneratedArticle(response.data.article);
      }
      
      setCurrentView(response.step);
    } catch (error) {
      console.error('Error starting article generation:', error);
      // Обработка ошибки
    }
  };

  const handleAnswerChange = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[step] = answer;
    setAnswers(newAnswers);
  };

  const handleNextStep = async () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setCurrentView('loading');
      try {
        const response = await articleApi.submitAnswers(
          Object.fromEntries(answers.map((answer, i) => [`answer${i + 1}`, answer]))
        );
        
        if (response.step === 'plan' && response.data.plan) {
          setChapters(response.data.plan);
        } else if (response.step === 'article' && response.data.article) {
          setGeneratedArticle(response.data.article);
        }
        
        setCurrentView(response.step);
      } catch (error) {
        console.error('Error submitting answers:', error);
        // Обработка ошибки
      }
    }
  };

  const handleChapterChange = (index: number, field: 'title' | 'note', value: string) => {
    const newChapters = chapters.map((chapter, i) => {
      if (i === index) {
        return { ...chapter, [field]: value };
      }
      return chapter;
    });
    setChapters(newChapters);
  };

  const handleMarkdownChange = (markdown: string) => {
    // Парсим markdown и обновляем chapters
    const lines = markdown.split('\n');
    const newChapters: { title: string; note: string }[] = [];
    let currentChapter: { title: string; note: string } | null = null;

    lines.forEach(line => {
      if (line.startsWith('- **')) {
        if (currentChapter) {
          newChapters.push(currentChapter);
        }
        const title = line.replace(/^-\s*\*\*(.*?)\*\*$/, '$1').trim();
        currentChapter = { title, note: '' };
      } else if (currentChapter && line.trim() && !line.startsWith('###')) {
        currentChapter.note = line.trim();
      }
    });

    if (currentChapter) {
      newChapters.push(currentChapter);
    }

    setChapters(newChapters);
  };

  const handleGenerate = async () => {
    try {
      setCurrentView('loading');
      const response = await articleApi.submitPlan(chapters);
      
      if (response.step === 'article' && response.data.article) {
        setGeneratedArticle(response.data.article);
        setCurrentView('article');
      }
    } catch (error) {
      console.error('Error generating article:', error);
      showError('Ошибка при генерации статьи');
    }
  };

  

  const toggleEditMode = () => {
    if (!isEditing) {
      setEditableContent(generatedArticle);
    } else {
      setGeneratedArticle(editableContent);
    }
    setIsEditing(!isEditing);
  };

  const openSaveDialog = () => {
    setShowSaveDialog(true);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'loading':
        return <LoadingAnimation />;
      case 'questions':
        return (
          <ArticleCreationSteps
            currentStep={step}
            steps={questions}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onNextStep={handleNextStep}
            isLastStep={step === questions.length - 1}
          />
        );
      case 'plan':
        return (
          <ArticlePlan
            chapters={chapters}
            onChapterChange={handleChapterChange}
            onGenerate={handleGenerate}
            onMarkdownChange={handleMarkdownChange}
          />
        );
      case 'article':
        return (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={openSaveDialog}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Сохранить в базе знаний
              </button>
            </div>
            <MarkdownEditor
              content={articleContent}
              isEditing={isEditing}
              onEdit={toggleEditMode}
              onSave={handleSave}
              onChange={(newContent) => {
                setEditableContent(newContent);
              }}
              title={articleName || topic}
              autoSave={true}
              itemId={articleTempId}
            />
          </>
        );
      default:
        return (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Создание статьи</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Тема статьи
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="Введите тему статьи..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Материал (опционально)
                  </label>
                  <textarea
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                    rows={4}
                    placeholder="Вставьте дополнительный материал..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Стиль статьи
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {ARTICLE_STYLES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Длина статьи
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {ARTICLE_LENGTHS.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setLength(l.id)}
                        className={`relative group flex items-center p-2 rounded-lg border transition-all ${
                          length === l.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        <div className={`flex-shrink-0 transition-colors ${
                          length === l.id
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                        }`}>
                          {l.icon}
                        </div>
                        <div className="ml-3">
                          <div className={`text-sm font-medium transition-colors ${
                            length === l.id
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

                <button
                  onClick={handleInitialSubmit}
                  disabled={!topic}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Продолжить
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <NavigationMenu />
      <div className="max-w-6xl mx-auto px-4 py-12">
        {renderContent()}
      </div>

      <SaveContentDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={(targetFolderId, fileName) => handleSave(targetFolderId, fileName)}
        items={items}
        defaultFileName={articleName || topic || 'Новая статья'}
        contentType="статью"
        title="Сохранить статью"
      />
    </div>
  );
}

export default RegularArticle;
