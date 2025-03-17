import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavigationMenu } from '../components/NavigationMenu';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { GoalViewer } from '../components/GoalViewer';
import { ReelsList } from '../components/ReelsList';
import { RichTextEditor } from '../components/RichTextEditor';
import { ContentPlanViewer } from '../components/ContentPlanViewer';
import { useGeneration } from '../context/GenerationContext';
import { useToast } from '../context/ToastContext';

function TaskResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchTaskResult } = useGeneration();
  const { showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [taskType, setTaskType] = useState<string>('');

  useEffect(() => {
    const loadResult = async () => {
      const state = location.state;
      
      if (!state?.taskId || !state?.type) {
        navigate('/tasks');
        return;
      }

      setTaskType(state.type);
      setIsLoading(true);

      try {
        const taskResult = await fetchTaskResult(state.taskId);
        if (taskResult) {
          setResult(taskResult);
        } else {
          showError('Не удалось загрузить результат');
          navigate('/tasks');
        }
      } catch (error) {
        console.error('Error loading task result:', error);
        showError('Ошибка при загрузке результата');
        navigate('/tasks');
      } finally {
        setIsLoading(false);
      }
    };

    loadResult();
  }, [location.state, navigate, fetchTaskResult, showError]);

  if (isLoading) {
    return <LoadingAnimation withNavigation />;
  }

  const renderResult = () => {
    if (!result) return null;

    switch (taskType) {
      case 'roadmap':
        return (
          <div className="max-w-7xl mx-auto px-4">
            <GoalViewer
              jsonData={result}
              completedTasks={[]}
              onTaskToggle={() => {}}
              editable={false}
            />
          </div>
        );

      case 'reels':
        return (
          <div className="max-w-7xl mx-auto px-4">
            <ReelsList reels={result} />
          </div>
        );

      case 'content-plan':
        return (
          <div className="max-w-7xl mx-auto px-4">
            <ContentPlanViewer data={result} />
          </div>
        );

      case 'article':
      case 'educational':
      case 'notes':
      case 'simplify':
        return (
          <div className="max-w-6xl mx-auto px-4">
            <RichTextEditor
              content={result}
              isEditing={false}
              onEdit={() => {}}
              onSave={() => {}}
              onChange={() => {}}
              title="Результат"
              withBackground={true}
            />
          </div>
        );

      default:
        return (
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Неизвестный тип результата
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <NavigationMenu onBack={() => navigate('/tasks')} />
      <div className="py-12">
        {renderResult()}
      </div>
    </div>
  );
}

export default TaskResult;