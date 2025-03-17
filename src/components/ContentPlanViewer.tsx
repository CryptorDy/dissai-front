import React, { useState } from 'react';
import { Calendar, Clock, Instagram, FileText, Layers } from 'lucide-react';

interface ContentPlanViewerProps {
  data: any;
}

export function ContentPlanViewer({ data }: ContentPlanViewerProps) {
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Данные контент-плана не найдены или имеют неверный формат</p>
        </div>
      </div>
    );
  }

  // Извлекаем месяц из данных или используем текущий
  const month = data.month || data.data?.month || 'Текущий месяц';
  
  // Устанавливаем активный месяц при первой загрузке
  if (!activeMonth) {
    setActiveMonth(month);
  }

  // Получаем календарь из данных
  const calendar = data.calendar || data.data?.calendar || [];
  
  // Получаем общую информацию
  const overview = data.overview || data.data?.overview || {};
  
  // Получаем статистику
  const contentSummary = data.contentSummary || data.data?.contentSummary || {};

  // Группируем контент по дням недели для представления списком
  const groupByDayOfWeek = () => {
    const grouped: { [key: string]: any[] } = {};
    
    calendar.forEach((day: any) => {
      if (day.content && day.content.length > 0) {
        const dayOfWeek = day.dayOfWeek;
        if (!grouped[dayOfWeek]) {
          grouped[dayOfWeek] = [];
        }
        
        day.content.forEach((content: any) => {
          grouped[dayOfWeek].push({
            ...content,
            date: day.date
          });
        });
      }
    });
    
    return grouped;
  };

  const groupedByDay = groupByDayOfWeek();

  // Получаем цвет для типа контента
  const getContentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'статья':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      case 'reels':
        return 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400';
      case 'пост':
        return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  // Получаем иконку для типа контента
  const getContentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'статья':
        return <FileText className="w-4 h-4" />;
      case 'reels':
        return <Instagram className="w-4 h-4" />;
      case 'пост':
        return <Layers className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {data.title || data.data?.title || 'Контент-план'}
        </h2>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" />
            <span>{month}</span>
          </div>
          
          {overview.topic && (
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <span className="font-medium mr-2">Тема:</span>
              <span>{overview.topic}</span>
            </div>
          )}
        </div>
        
        {/* Переключатель режима просмотра */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Календарь
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Список
            </button>
          </div>
        </div>
      </div>

      {/* Обзор и статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Обзор */}
        {overview && Object.keys(overview).length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Обзор
            </h3>
            <div className="space-y-3">
              {overview.keywords && overview.keywords.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ключевые слова:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {overview.keywords.map((keyword: string, index: number) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {overview.goals && overview.goals.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Цели:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {overview.goals.map((goal: string, index: number) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {overview.audience && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Аудитория:</p>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {overview.audience.name && (
                      <p><span className="font-medium">Название:</span> {overview.audience.name}</p>
                    )}
                    {overview.audience.demographics && (
                      <p><span className="font-medium">Демография:</span> {overview.audience.demographics}</p>
                    )}
                  </div>
                </div>
              )}
              
              {overview.contentStyles && overview.contentStyles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Стили контента:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {overview.contentStyles.map((style: string, index: number) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full text-xs"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Статистика */}
        {contentSummary && Object.keys(contentSummary).length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Статистика
            </h3>
            <div className="space-y-4">
              {contentSummary.totalPosts && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{contentSummary.totalPosts}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Всего публикаций</p>
                </div>
              )}
              
              {contentSummary.byType && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">По типу:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(contentSummary.byType).map(([type, count]) => (
                      <div key={type} className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{count}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {contentSummary.byPlatform && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">По платформам:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(contentSummary.byPlatform).map(([platform, count]) => (
                      <div key={platform} className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{count}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{platform}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Календарь или список */}
      {viewMode === 'calendar' ? (
        <div className="space-y-6">
          {calendar.map((day: any, index: number) => (
            <div 
              key={index}
              className={`border-l-4 ${
                day.content && day.content.length > 0
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-700'
              } pl-4 py-2`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {day.date} • {day.dayOfWeek}
                  </span>
                </div>
              </div>
              
              {day.content && day.content.length > 0 ? (
                <div className="space-y-3">
                  {day.content.map((content: any, contentIndex: number) => (
                    <div 
                      key={contentIndex}
                      className="bg-white dark:bg-gray-700 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getContentTypeColor(content.type)}`}>
                              {getContentTypeIcon(content.type)}
                              <span className="ml-1">{content.type}</span>
                            </span>
                            {content.time && (
                              <span className="ml-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="w-3 h-3 mr-1" />
                                {content.time}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {content.title}
                          </h4>
                          {content.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {content.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {content.platform && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Платформы: {content.platform}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Нет запланированных публикаций</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByDay).map(([dayOfWeek, contents]) => (
            <div key={dayOfWeek} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {dayOfWeek}
              </h3>
              <div className="space-y-3">
                {contents.map((content: any, index: number) => (
                  <div 
                    key={index}
                    className="bg-white dark:bg-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getContentTypeColor(content.type)}`}>
                            {getContentTypeIcon(content.type)}
                            <span className="ml-1">{content.type}</span>
                          </span>
                          <span className="ml-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            {content.date}
                          </span>
                          {content.time && (
                            <span className="ml-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3 mr-1" />
                              {content.time}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {content.title}
                        </h4>
                        {content.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {content.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {content.platform && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Платформы: {content.platform}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
