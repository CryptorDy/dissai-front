import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  FileText, 
  Target, 
  BookOpen, 
  GraduationCap,
  FileQuestion,
  FileEdit,
  Instagram,
  AlertCircle,
  Users
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

type Feature = {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  path: string;
  isPrimary?: boolean;
  inDevelopment?: boolean;
};

function Home() {
  const navigate = useNavigate();
  
  const features: Feature[] = [
    {
      id: 'knowledge',
      title: 'Моя база знаний',
      icon: <BookOpen className="w-6 h-6" />,
      description: 'Ваша персональная библиотека статей, конспектов и целей',
      path: '/knowledge',
      isPrimary: true
    },
    {
      id: 'regular-article',
      title: 'Статья',
      icon: <FileText className="w-6 h-6" />,
      description: 'Создайте информативную статью на выбранную тему',
      path: '/articles/regular',
      inDevelopment: true
    },
    {
      id: 'content-plan',
      title: 'Контент-план',
      icon: <FileEdit className="w-6 h-6" />,
      description: 'Создайте детальный план контента с учетом целей и аудитории',
      path: '/articles/content-plan',
      inDevelopment: true
    },
    {
      id: 'notes',
      title: 'Конспект',
      icon: <BookOpen className="w-6 h-6" />,
      description: 'Создайте структурированный конспект из текста, видео или других источников',
      path: '/articles/notes',
      inDevelopment: true
    },
    {
      id: 'reels',
      title: 'Анализ Reels',
      icon: <Instagram className="w-6 h-6" />,
      description: 'Получите текстовую версию контента из Instagram Reels',
      path: '/articles/reels'
    },
    {
      id: 'roadmap',
      title: 'Roadmap',
      icon: <Target className="w-6 h-6" />,
      description: 'Составьте пошаговый план достижения ваших целей',
      path: '/roadmap'
    },
    {
      id: 'educational',
      title: 'Учебный материал',
      icon: <GraduationCap className="w-6 h-6" />,
      description: 'Создайте обучающий материал с тестами и упражнениями',
      path: '/articles/educational',
      inDevelopment: true
    },
    {
      id: 'simplify',
      title: 'Пересказ научной работы',
      icon: <FileQuestion className="w-6 h-6" />,
      description: 'Преобразуйте сложный научный текст в понятный формат',
      path: '/articles/simplify',
      inDevelopment: true
    },
    {
      id: 'target-audience',
      title: 'Целевая аудитория',
      icon: <Users className="w-6 h-6" />,
      description: 'Анализ и сегментация целевой аудитории для вашего контента',
      path: '/audience',
      inDevelopment: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Dissai.io
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Цифровая мастерская контента с искусственным интеллектом
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.filter(f => f.isPrimary).map((feature) => (
            <button
              key={feature.id}
              onClick={() => navigate(feature.path)}
              className="md:col-span-3 p-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-left hover:scale-[1.02] group"
            >
              <div className="text-white mb-4">
                {feature.icon}
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">{feature.title}</h2>
              <p className="text-blue-100 group-hover:text-white transition-colors">{feature.description}</p>
            </button>
          ))}

          {features.filter(f => !f.isPrimary).map((feature) => (
            <button
              key={feature.id}
              onClick={() => !feature.inDevelopment && navigate(feature.path)}
              disabled={feature.inDevelopment}
              className={`p-6 rounded-xl transition-all duration-200 text-left hover:scale-105 ${
                feature.inDevelopment ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                feature.inDevelopment 
                  ? 'bg-gray-100 dark:bg-gray-700/70' 
                  : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
              }`}
            >
              <div className="relative">
                {feature.inDevelopment && (
                  <div className="absolute top-0 right-0 flex items-center text-yellow-600 dark:text-yellow-400">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">В разработке</span>
                  </div>
                )}
                <div className="text-blue-600 dark:text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            </button>
          ))}
        </div>
        
      </div>
    </div>
  );
}

export default Home;
