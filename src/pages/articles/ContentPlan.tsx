import React, { useState, useEffect } from 'react';
import { NavigationMenu } from '../../components/NavigationMenu';
import { RichTextEditor } from '../../components/RichTextEditor';
import { LoadingAnimation } from '../../components/LoadingAnimation';
import { Target, Users, Brain, ArrowRight, FileText, Calendar, Save } from 'lucide-react';
import { knowledgeApi, KnowledgeItem } from '../../services/api';
import { ArticleSelectorDialog } from '../../components/ArticleSelectorDialog';
import { SaveContentDialog } from '../../components/SaveContentDialog';
import { useGeneration } from '../../context/GenerationContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

// Остальной код остается без изменений...

function ContentPlan() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [articles, setArticles] = useState<KnowledgeItem[]>([]);
  const [showArticleSelector, setShowArticleSelector] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { addTask, updateTask, removeTask } = useGeneration();
  const [formData, setFormData] = useState({
    topic: '',
    keywords: [],
    goals: [],
    audience: {
      id: '',
      name: '',
      interests: [],
      demographics: '',
      painPoints: [],
      needs: []
    },
    contentStyles: [],
    context: {
      articleId: null,
      prompt: ''
    },
    schedule: {
      postsPerWeek: 3,
      reelsPerWeek: 2,
      bestDays: ['mon', 'wed', 'fri'],
      bestTime: '10:00'
    }
  });

  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await knowledgeApi.getItems();
        setArticles(items);
      } catch (error) {
        console.error('Error loading articles:', error);
      }
    };
    loadItems();
  }, []);

  const handleSave = async (targetFolderId?: string | null, fileName?: string) => {
    const finalContent = isEditing ? editableContent : content;
    
    if (targetFolderId !== undefined && fileName) {
      try {
        // Преобразуем контент-план в JSON
        const contentPlanData = generateContentPlanData();
        const contentPlanJson = JSON.stringify(contentPlanData);
        
        const newItem = {
          type: 'file' as const,
          fileType: 'content-plan' as const,
          name: fileName,
          content: contentPlanJson,
          parentId: targetFolderId
        };

        await knowledgeApi.saveItem(newItem);
        navigate('/knowledge');
        setShowSaveDialog(false);
      } catch (error) {
        console.error('Failed to save content plan:', error);
        showError('Ошибка при сохранении контент-плана');
      }
    } else if (!fileName) {
      // Экспорт в файл
      const blob = new Blob([finalContent || ''], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'content-plan.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const toggleEditMode = () => {
    if (!isEditing) {
      setEditableContent(content || '');
    } else {
      setContent(editableContent);
    }
    setIsEditing(!isEditing);
  };

  const openSaveDialog = () => {
    setShowSaveDialog(true);
  };

  // Остальной код остается без изменений...

  // Функция generateContentPlanData и другие вспомогательные функции остаются без изменений

  if (isLoading) {
    return <LoadingAnimation withNavigation />;
  }

  if (content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
        <NavigationMenu />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex justify-end mb-4">
            <button
              onClick={openSaveDialog}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Сохранить в базе знаний
            </button>
          </div>
          <RichTextEditor
            content={isEditing ? editableContent : content}
            isEditing={isEditing}
            onEdit={toggleEditMode}
            onSave={handleSave}
            onChange={setEditableContent}
            title="Контент-план"
          />
        </div>

        <SaveContentDialog
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSave={(targetFolderId, fileName) => handleSave(targetFolderId, fileName)}
          items={articles}
          defaultFileName={formData.topic || 'Контент-план'}
          contentType="контент-план"
          title="Сохранить контент-план"
        />
      </div>
    );
  }

  // Остальной код остается без изменений...
}

export default ContentPlan;
