import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavigationMenu } from '../components/NavigationMenu';
import { GoalViewer } from '../components/GoalViewer';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { knowledgeApi, KnowledgeItem } from '../services/api';
import { SaveContentDialog } from '../components/SaveContentDialog';
import { Save } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface RoadmapData {
  goal: string;
  tasks: {
    title: string;
    deadline?: string;
    description?: string;
    completed?: boolean;
    subtasks?: {
      title: string;
      deadline?: string;
      description?: string;
      completed?: boolean;
      resources?: string[] | {
        title: string;
        url: string;
        type: string;
      }[];
    }[];
  }[];
}

function RoadmapResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  useEffect(() => {
    if (location.state) {
      try {
        let data;
        // Проверяем, пришли ли данные от api/roadmap/generate
        if (location.state.content) {
          try {
            data = JSON.parse(location.state.content);
          } catch (e) {
            console.error('Error parsing content JSON:', e);
            data = null;
          }
        }
        // Если не удалось получить данные из content, проверяем прямые данные
        if (!data && location.state.goal && location.state.tasks) {
          data = location.state;
        }
        // Если данные получены от api/knowledge/file
        else if (location.state.content) {
          try {
            data = JSON.parse(location.state.content);
          } catch (e) {
            console.error('Error parsing file content:', e);
            data = null;
          }
        }

        // Проверяем корректность данных
        if (data && data.goal && Array.isArray(data.tasks)) {
          console.log("Setting roadmap data:", data);
          setRoadmapData(data);
          setEditableContent(JSON.stringify(data, null, 2));
        } else {
          // Если данные некорректные, перенаправляем на страницу создания
          console.error('Invalid roadmap data structure');
          navigate('/roadmap');
        }
      } catch (e) {
        console.error('Error processing roadmap data:', e);
        navigate('/roadmap');
      }
    } else {
      navigate('/roadmap');
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

  const handleTaskToggle = (index: number) => {
    setCompletedTasks(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleMarkdownChange = (newContent: string) => {
    setEditableContent(newContent);
    try {
      const data = JSON.parse(newContent);
      setRoadmapData(data);
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  };

  const handleSave = async (targetFolderId?: string | null, fileName?: string) => {
    const content = isEditing ? editableContent : (roadmapData ? JSON.stringify(roadmapData, null, 2) : '');
    
    if (targetFolderId !== undefined && fileName) {
      try {
        const newItem = {
          type: 'file' as const,
          fileType: 'roadmap-item' as const,
          name: fileName,
          content,
          parentId: targetFolderId,
          metadata: {
            completedTasks
          }
        };

        await knowledgeApi.saveItem(newItem);
        showSuccess('Родмап успешно сохранен в базе знаний');
        setShowSaveDialog(false);
        navigate('/knowledge');
      } catch (error) {
        console.error('Failed to save roadmap:', error);
        showError('Ошибка при сохранении родмапа');
      }
    } else if (!fileName) {
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'roadmap.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const toggleEditMode = () => {
    if (!isEditing) {
      setEditableContent(roadmapData ? JSON.stringify(roadmapData, null, 2) : '');
    } else {
      try {
        const data = JSON.parse(editableContent);
        setRoadmapData(data);
      } catch (e) {
        console.error('Error parsing JSON:', e);
        showError('Ошибка в формате JSON');
        return;
      }
    }
    setIsEditing(!isEditing);
  };

  const openSaveDialog = () => {
    setShowSaveDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <NavigationMenu onBack={() => navigate('/roadmap')} />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="text-center mb-8">
          {roadmapData?.goal && (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {roadmapData.goal}
            </h1>
          )}
          {location.state?.detailLevel && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Уровень детализации: {location.state.detailLevel}/10
            </p>
          )}
        </header>

        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={openSaveDialog}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </button>
          </div>

          {isEditing ? (
            <MarkdownEditor
              content={editableContent}
              isEditing={true}
              onEdit={toggleEditMode}
              onSave={handleSave}
              onChange={handleMarkdownChange}
              title="План"
            />
          ) : (
            <GoalViewer
              jsonData={roadmapData}
              completedTasks={completedTasks}
              onTaskToggle={handleTaskToggle}
              onMarkdownChange={handleMarkdownChange}
              editable={true}
            />
          )}
        </div>
      </div>

      <SaveContentDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={(targetFolderId, fileName) => handleSave(targetFolderId, fileName)}
        items={items}
        defaultFileName={roadmapData?.goal || 'План развития'}
        contentType="родмап"
        title="Сохранить родмап"
      />
    </div>
  );
}

export default RoadmapResult;
