import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavigationMenu } from '../../components/NavigationMenu';
import { ReelsList } from '../../components/ReelsList';
import { Save } from 'lucide-react';
import { SaveContentDialog } from '../../components/SaveContentDialog';
import { knowledgeApi, KnowledgeItem } from '../../services/api';
import { useToast } from '../../context/ToastContext';

function ReelsResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  
  // Получаем и нормализуем данные
  const reelsData = React.useMemo(() => {
    try {
      if (!location.state) {
        return [];
      }

      // Проверяем, пришли ли данные от api/reels/analyze
      if (Array.isArray(location.state)) {
        return location.state;
      }

      // Проверяем, пришли ли данные из результата задачи
      if (location.state.result && Array.isArray(location.state.result)) {
        return location.state.result;
      }

      // Если данные получены от api/tasks/result
      if (location.state.status === 'Completed' && Array.isArray(location.state.result)) {
        return location.state.result;
      }

      // Если данные получены от api/knowledge/file
      if (location.state.content) {
        try {
          const parsed = JSON.parse(location.state.content);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {
          console.error('Error parsing file content:', e);
        }
      }

      return [];
    } catch (error) {
      console.error('Error processing reels data:', error);
      return [];
    }
  }, [location.state]);

  // Получаем ID исходного файла
  const sourceId = React.useMemo(() => {
    if (!location.state) return null;
    return location.state.id || null;
  }, [location.state]);

  // Перенаправляем на страницу анализа, если нет данных
  useEffect(() => {
    if (!location.state) {
      navigate('/articles/reels');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const loadItems = async () => {
      setIsLoadingItems(true);
      try {
        const data = await knowledgeApi.getItems();
        setItems(data);
      } catch (error) {
        console.error('Error loading folders:', error);
      } finally {
        setIsLoadingItems(false);
      }
    };

    loadItems();
  }, []);

  const handleSave = async (targetFolderId?: string | null, fileName?: string) => {
    if (targetFolderId !== undefined && fileName) {
      try {
        const newItem = {
          type: 'file' as const,
          fileType: 'reels' as const,
          name: fileName,
          content: JSON.stringify(reelsData),
          parentId: targetFolderId
        };

        await knowledgeApi.saveItem(newItem);
        showSuccess('Reels успешно сохранены в базе знаний');
        setShowSaveDialog(false);
        navigate('/knowledge');
      } catch (error) {
        console.error('Failed to save reels:', error);
        showError('Ошибка при сохранении Reels');
      }
    }
  };

  // Определяем количество Reels для отображения
  const getReelsCount = () => {
    return reelsData.length;
  };

  // Если нет данных, показываем сообщение
  if (reelsData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
        <NavigationMenu onBack={() => navigate('/articles/reels')} />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Нет данных для отображения
            </h1>
            <button
              onClick={() => navigate('/articles/reels')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Вернуться к анализу
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <NavigationMenu onBack={() => navigate('/articles/reels')} />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Найденные Reels ({getReelsCount()})
          </h1>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Сохранить в базе знаний
          </button>
        </div>

        <ReelsList reels={reelsData} sourceId={sourceId} />

        <SaveContentDialog
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSave={(targetFolderId, fileName) => handleSave(targetFolderId, fileName)}
          items={items}
          defaultFileName={`Reels (${getReelsCount()})`}
          contentType="reels"
          title="Сохранить Reels"
        />
      </div>
    </div>
  );
}

export default ReelsResult;
