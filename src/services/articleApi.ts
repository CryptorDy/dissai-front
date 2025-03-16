import axios from 'axios';
import { API_URL } from '../config/api';

export type ArticleGenerationStep = 'questions' | 'plan' | 'article';

interface ArticleGenerationResponse {
  step: ArticleGenerationStep;
  data: {
    questions?: Array<{
      question: string;
      placeholder: string;
    }>;
    plan?: Array<{
      title: string;
      note: string;
    }>;
    article?: string;
  };
}

interface ArticleSettings {
  topic: string;
  material?: string;
  style: string;
  length: string;
}

interface ArticleAnswers {
  [key: string]: string;
}

const api = axios.create({
  baseURL: API_URL,
});

export const articleApi = {
  startGeneration: async (settings: ArticleSettings): Promise<ArticleGenerationResponse> => {
    try {
      const response = await api.post('/articles/generate/start', settings);
      return response.data;
    } catch {
      // Моковый ответ для демонстрации
      return {
        step: 'questions',
        data: {
          questions: [
            {
              question: 'Какие ключевые аспекты темы вы хотите раскрыть?',
              placeholder: 'Опишите основные моменты, которые должны быть освещены в статье...'
            },
            {
              question: 'Какую цель должна достичь статья?',
              placeholder: 'Например: информировать, убедить, развлечь...'
            },
            {
              question: 'Кто ваша целевая аудитория?',
              placeholder: 'Опишите, для кого предназначена статья...'
            }
          ]
        }
      };
    }
  },

  submitAnswers: async (answers: ArticleAnswers): Promise<ArticleGenerationResponse> => {
    try {
      const response = await api.post('/articles/generate/answers', answers);
      return response.data;
    } catch {
      // Моковый ответ для демонстрации
      return {
        step: 'plan',
        data: {
          plan: [
            { title: 'Введение', note: 'Общий обзор темы' },
            { title: 'Основная часть 1', note: 'Ключевые концепции' },
            { title: 'Основная часть 2', note: 'Практическое применение' },
            { title: 'Заключение', note: 'Подведение итогов' }
          ]
        }
      };
    }
  },

  submitPlan: async (plan: Array<{ title: string; note: string }>): Promise<ArticleGenerationResponse> => {
    try {
      const response = await api.post('/articles/generate/plan', { plan });
      return response.data;
    } catch {
      // Моковый ответ для демонстрации
      return {
        step: 'article',
        data: {
          article: `# Сгенерированная статья\n\n## Введение\nОбщий обзор темы...\n\n## Основная часть 1\nКлючевые концепции...\n\n## Основная часть 2\nПрактическое применение...\n\n## Заключение\nПодведение итогов...`
        }
      };
    }
  }
};
