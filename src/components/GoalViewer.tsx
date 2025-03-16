import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Baseline as Timeline } from 'lucide-react';
import { TimelineView } from './TimelineView';
import { ModernTaskList } from './ModernTaskList';

type ViewType = 'modern' | 'timeline';

interface Task {
  title: string;
  deadline?: string;
  description?: string;
  completed?: boolean;
  subtasks?: Task[];
  resources?: string[] | {
    title: string;
    url: string;
    type: string;
  }[];
}

interface RoadmapData {
  goal: string;
  tasks: Task[];
}

interface GoalViewerProps {
  markdown?: string;
  jsonData?: RoadmapData | null;
  completedTasks?: number[];
  onTaskToggle?: (index: number) => void;
  onMarkdownChange?: (newMarkdown: string) => void;
  editable?: boolean;
}

export function GoalViewer({
  markdown,
  jsonData,
  completedTasks = [],
  onTaskToggle,
  onMarkdownChange,
  editable = true
}: GoalViewerProps) {
  const [currentView, setCurrentView] = useState<ViewType>('modern');
  const [parsedData, setParsedData] = useState<RoadmapData | null>(null);

  useEffect(() => {
    if (jsonData) {
      setParsedData(jsonData);
    } else if (markdown) {
      try {
        const data = JSON.parse(markdown);
        setParsedData(data);
      } catch (e) {
        console.error("Error parsing JSON in GoalViewer:", e);
        setParsedData(null);
      }
    } else {
      setParsedData(null);
    }
  }, [jsonData, markdown]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center space-x-2">
        {[
          { id: 'modern', icon: <List className="w-4 h-4" />, label: 'Список' },
          { id: 'timeline', icon: <Timeline className="w-4 h-4" />, label: 'Таймлайн' }
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setCurrentView(option.id as ViewType)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              currentView === option.id
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            {option.icon}
            <span className="ml-2">{option.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'timeline' ? (
              <TimelineView 
                markdown={parsedData ? JSON.stringify(parsedData) : markdown || ''} 
                completedTasks={completedTasks} 
              />
            ) : (
              <ModernTaskList
                jsonData={parsedData}
                completedTasks={completedTasks}
                onTaskToggle={onTaskToggle}
                onMarkdownChange={onMarkdownChange}
                editable={editable}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
