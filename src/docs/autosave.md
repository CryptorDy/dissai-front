# Документация по автосохранению в базе знаний

## Общая информация

В проекте реализован механизм автосохранения для всех компонентов базы знаний. Автосохранение работает следующим образом:

1. Пользователь редактирует контент
2. Если пользователь прекращает ввод на 800 мс, система автоматически сохраняет изменения
3. Сохранение происходит незаметно для пользователя, без прерывания его работы

## Архитектура автосохранения

Автосохранение реализовано с использованием следующих компонентов:

1. **`useAutoSave`** - хук для автоматического сохранения контента с debounce
2. **`useIdleDetection`** - хук для отслеживания бездействия пользователя
3. **`autoSaveService`** - сервис для централизованного управления автосохранением

## Технические особенности автосохранения

- Сохранение происходит только после реальных изменений контента
- Система реагирует только на события ввода с клавиатуры, игнорируя движения мыши
- Механизм предотвращает дублирование запросов на сохранение
- Оптимизирована задержка в 800 мс для баланса между отзывчивостью и нагрузкой

## Использование автосохранения в компонентах

### Компонент RichTextEditor

`RichTextEditor` уже интегрирован с автосохранением. Для включения автосохранения в компоненте, использующем RichTextEditor, необходимо передать следующие параметры:

```tsx
<RichTextEditor
  content={content}
  onChange={setContent}
  onSave={handleManualSave}
  itemId={itemId}       // ID элемента для сохранения
  autoSave={true}       // Включает автосохранение (по умолчанию включено)
  fileType="article"    // Тип файла (по умолчанию "article")
/>
```

### Использование в новом компоненте

Чтобы добавить автосохранение в новый компонент:

1. Импортируйте необходимые хуки и сервисы:

```tsx
import { useAutoSave, useIdleDetection } from '../hooks';
import { autoSaveService } from '../services';
```

2. Реализуйте логику автосохранения в компоненте:

```tsx
// Состояние контента и флаг изменений
const [content, setContent] = useState(initialContent);
const [hasChanges, setHasChanges] = useState(false);
const [lastSavedContent, setLastSavedContent] = useState(initialContent);

// Инициализация автосохранения
const { isSaving, saveError, forceSave, lastSaveResult } = useAutoSave(
  content,
  async (contentToSave: string, id?: string) => {
    return autoSaveService.saveItem('yourFileType', contentToSave, id || itemId);
  },
  800, // задержка 800 мс
  false, // управление через idle detection
  itemId
);

// Обновляем lastSavedContent при успешном сохранении
useEffect(() => {
  if (lastSaveResult) {
    setLastSavedContent(content);
    setHasChanges(false);
  }
}, [lastSaveResult, content]);

// Функция для сохранения при бездействии
const handleIdleSave = useCallback(() => {
  if (autoSave && itemId && hasChanges && !isSaving) {
    if (JSON.stringify(content) !== JSON.stringify(lastSavedContent)) {
      forceSave().catch(error => {
        console.error('Ошибка при автосохранении:', error);
      });
    } else {
      setHasChanges(false);
    }
  }
}, [autoSave, itemId, hasChanges, isSaving, forceSave, content, lastSavedContent]);

// Инициализация обнаружения бездействия
const { isIdle } = useIdleDetection(
  800, // 800мс бездействия
  handleIdleSave, // вызываем сохранение при бездействии
  ['keydown'] // отслеживаем только нажатия клавиш
);
```

## Регистрация обработчиков сохранения для новых типов файлов

Чтобы зарегистрировать специальный обработчик для нового типа файла:

```tsx
import { autoSaveService } from '../services';

// Регистрация функции сохранения для типа 'custom'
autoSaveService.registerSaveFunction('custom', async (content: any, itemId?: string) => {
  // Реализуйте специфичную логику сохранения
  // ...
  return result;
});
```

## Дополнительная информация

- Все автосохранения происходят асинхронно и не блокируют пользовательский интерфейс
- При размонтировании компонента, если есть несохраненные изменения, они будут автоматически сохранены
- Задержка в 800 мс выбрана как оптимальная между быстрым откликом и предотвращением частых сохранений
- Автосохранение срабатывает только при реальных изменениях контента, не отправляя лишние запросы 