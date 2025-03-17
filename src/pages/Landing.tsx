import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Landing() {
  const navigate = useNavigate();
  const [iframeHeight, setIframeHeight] = useState('100vh');
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    // При загрузке страницы добавляем CSS для скрытия оригинальных кнопок навигации в iframe
    const injectCSS = () => {
      try {
        const iframe = document.getElementById('landing-iframe') as HTMLIFrameElement | null;
        if (!iframe) return;
        
        // Используем contentWindow и расширяем время ожидания
        // для доступа к contentDocument
        if (iframe.contentWindow) {
          // Пытаемся получить доступ к contentDocument
          const doc = iframe.contentWindow.document;
          
          // Добавляем стили
          const style = doc.createElement('style');
          style.textContent = `
            .get-started-btn, .primary-menu .btn {
              display: none !important;
            }
            
            /* Подключаем шрифт, поддерживающий русский язык */
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
            
            body, h1, h2, h3, h4, h5, h6, p, a, button, input, textarea, select, span, div {
              font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
            }
            
            /* Фиксируем размеры для русского текста */
            .hero__title {
              font-size: 3.5rem !important;
              line-height: 1.2 !important;
              font-weight: 700 !important;
            }
            
            .hero__text {
              font-size: 1.25rem !important;
              line-height: 1.6 !important;
            }
          `;
          doc.head.appendChild(style);
          
          // Подключаем шрифт напрямую
          const fontLink = doc.createElement('link');
          fontLink.rel = 'stylesheet';
          fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap';
          doc.head.appendChild(fontLink);
          
          // Добавляем нашу кнопку внутрь iframe
          const heroSection = doc.querySelector('.hero');
          if (heroSection) {
            const button = doc.createElement('a');
            button.className = 'btn btn-primary rounded-pill mt-4';
            button.style.backgroundColor = '#4d61e5';
            button.style.borderColor = '#4d61e5';
            button.style.padding = '12px 28px';
            button.style.fontSize = '16px';
            button.style.fontWeight = 'bold';
            button.style.marginTop = '20px';
            button.style.display = 'inline-block';
            button.textContent = 'Начать бесплатно';
            button.href = '/auth/login';
            button.target = '_top';
            
            // Добавляем кнопку в конец блока .hero__content
            const heroContent = heroSection.querySelector('.hero__content');
            if (heroContent) {
              heroContent.appendChild(button);
            }
          }
          
          // Обновляем описание проекта
          const heroTitle = doc.querySelector('.hero__title');
          const heroSubtitle = doc.querySelector('.hero__text');
          
          if (heroTitle) {
            heroTitle.textContent = 'Dissai.io - Интеллектуальный помощник для создания контента';
          }
          
          if (heroSubtitle) {
            heroSubtitle.innerHTML = 'Создавайте профессиональный контент с помощью искусственного интеллекта. <br/>Статьи, roadmap, анализ, контент-планы и многое другое.';
          }
          
          // Обновляем другие элементы лендинга
          const aboutTitle = doc.querySelector('.about__title');
          if (aboutTitle) {
            aboutTitle.textContent = 'Почему выбирают Dissai.io?';
          }
          
          const aboutText = doc.querySelector('.about__text');
          if (aboutText) {
            aboutText.innerHTML = 'Наша платформа помогает создателям контента, маркетологам и предпринимателям эффективно решать задачи по созданию качественного контента, планированию и анализу.';
          }
          
          // Функция для изменения карточек преимуществ
          const updateFeatureCard = (index: number, title: string, description: string) => {
            const cards = doc.querySelectorAll('.about__item');
            if (cards && cards[index]) {
              const titleEl = cards[index].querySelector('.about__item-title');
              const textEl = cards[index].querySelector('.about__item-text');
              
              if (titleEl) titleEl.textContent = title;
              if (textEl) textEl.textContent = description;
            }
          };
          
          // Обновляем карточки преимуществ
          updateFeatureCard(0, 'Экономия времени', 'Создавайте контент в 5-10 раз быстрее с помощью интеллектуальных инструментов');
          updateFeatureCard(1, 'Качественный контент', 'Получайте профессиональный контент на основе ваших данных и потребностей');
          updateFeatureCard(2, 'Личная база знаний', 'Храните и управляйте всем вашим контентом в одном месте');
          updateFeatureCard(3, 'Анализ и планирование', 'Создавайте roadmap, контент-планы и анализируйте информацию');
          
          // Устанавливаем высоту iframe после загрузки
          setIframeHeight('100%');
          setIframeReady(true);
        }
      } catch (error) {
        console.error('Error injecting CSS into iframe:', error);
      }
    };
    
    // Увеличиваем время до 2 секунд для большей надежности
    const timer = setTimeout(injectCSS, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="landing-wrapper" style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <iframe 
        id="landing-iframe"
        src="/Index/index.html" 
        style={{ 
          width: '100%', 
          height: iframeHeight, 
          border: 'none', 
          overflow: 'auto',
          opacity: iframeReady ? 1 : 0,
          transition: 'opacity 0.5s ease'
        }}
        title="Dissai.io Landing"
      />
    </div>
  );
}

export default Landing; 