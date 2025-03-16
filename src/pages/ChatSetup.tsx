import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ChatSetupProps {
  chatType: {
    id: string;
    title: string;
    description: string;
  };
  onBack: () => void;
  onStart: (settings: ChatSettings) => void;
}

export interface ChatSettings {
  topic: string;
  depth: number;
  style: 'academic' | 'casual' | 'technical';
  focusAreas: string[];
}

const FOCUS_AREAS = {
  student: [
    'Теоретические основы',
    'Практическое применение',
    'Исторический контекст',
    'Современные тенденции',
    'Примеры и кейсы',
    'Методология'
  ],
  discussion: [
    'Анализ проблемы',
    'Сравнение подходов',
    'Критическая оценка',
    'Практические решения',
    'Инновационные идеи',
    'Исследования'
  ],
  brainstorm: [
    'Генерация идей',
    'Анализ возможностей',
    'Оценка рисков',
    'Практическая реализация',
    'Инновационные подходы',
    'Оптимизация'
  ]
};

function ChatSetup({ chatType, onBack, onStart }: ChatSetupProps) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ChatSettings>({
    topic: '',
    depth: 5,
    style: 'casual',
    focusAreas: []
  });

  const handleFocusAreaToggle = (area: string) => {
    setSettings(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const isValid = settings.topic.trim() && settings.focusAreas.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {chatType.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {chatType.description}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Тема обсуждения
            </label>
            <input
              type="text"
              value={settings.topic}
              onChange={(e) => setSettings({ ...settings, topic: e.target.value })}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Введите тему для обсуждения..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Глубина обсуждения
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">Обзорно</span>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.depth}
                onChange={(e) => setSettings({ ...settings, depth: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">Детально</span>
              <span className="w-8 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                {settings.depth}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Стиль общения
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'casual', label: 'Свободный' },
                { id: 'academic', label: 'Академический' },
                { id: 'technical', label: 'Технический' }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSettings({ ...settings, style: style.id as any })}
                  className={`p-3 rounded-lg border ${
                    settings.style === style.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Области фокусировки (выберите минимум одну)
            </label>
            <div className="grid grid-cols-2 gap-4">
              {FOCUS_AREAS[chatType.id as keyof typeof FOCUS_AREAS].map((area) => (
                <button
                  key={area}
                  onClick={() => handleFocusAreaToggle(area)}
                  className={`p-3 rounded-lg border text-left ${
                    settings.focusAreas.includes(area)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={() => onStart(settings)}
            disabled={!isValid}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Начать диалог
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ChatSetup;
