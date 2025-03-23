import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, 
  Trash2, 
  FolderPlus, 
  Move,
  FileText,
  MessageCircle,
  FileDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NavigationMenu } from '../components/NavigationMenu';
import { RichTextEditor } from '../components/RichTextEditor';
import { GoalViewer } from '../components/GoalViewer';
import { MoveDialog } from '../components/MoveDialog';
import { ChatHistory } from '../components/chat/ChatHistory';
import { ReelsList } from '../components/ReelsList';
import { knowledgeApi, KnowledgeItem } from '../services/api';
import { ChatMessage, ChatParticipant } from '../types/chat';
import { NewArticleDialog } from '../components/NewArticleDialog';
import { KnowledgeChat } from '../components/KnowledgeChat';
import { KnowledgeFileStructure } from '../components/KnowledgeFileStructure';
import { useToast } from '../context/ToastContext';
import { ContentPlanViewer } from '../components/ContentPlanViewer';

// Добавим объявление типа html2pdf для окна
declare global {
  interface Window {
    html2pdf: any;
  }
}

function Knowledge() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: KnowledgeItem } | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [moveDialogItem, setMoveDialogItem] = useState<KnowledgeItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [showNewArticleDialog, setShowNewArticleDialog] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newArticleParentId, setNewArticleParentId] = useState<string | undefined>();
  const [newFileType, setNewFileType] = useState<string>('');

  const contextMenuRef = useRef<HTMLDivElement>(null);
  const deleteDialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      const storageKey = `chat_open_${selectedItem.id}`;
      const isOpen = localStorage.getItem(storageKey) === 'true';
      setIsChatOpen(isOpen);
    }
  }, [selectedItem]);

  useEffect(() => {
    if (selectedItem) {
      const storageKey = `chat_open_${selectedItem.id}`;
      localStorage.setItem(storageKey, isChatOpen.toString());
    }
  }, [isChatOpen, selectedItem]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deleteDialogRef.current && !deleteDialogRef.current.contains(event.target as Node)) {
        setShowDeleteDialog(false);
        setItemToDelete(null);
      }
    }

    if (showDeleteDialog) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteDialog]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await knowledgeApi.getItems();
      
      if (Array.isArray(data) && data.length > 0) {
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (error) {
      showError('Ошибка при загрузке данных');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const isExpanded = prev.includes(id);
      if (isExpanded) {
        return prev.filter(folderId => folderId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Рекурсивно находит все родительские папки для элемента
  const findParentFolders = (items: KnowledgeItem[], itemId: string, path: string[] = []): string[] => {
    for (const item of items) {
      if (item.id === itemId) {
        return path;
      }
      if (item.itemType === 'folder' && item.children) {
        const result = findParentFolders(item.children, itemId, [...path, item.id]);
        if (result.length > 0) {
          return result;
        }
      }
    }
    return [];
  };

  // Функция для подготовки элемента к добавлению дочерних элементов
  const prepareParentForChildren = (parentId: string) => {
    // Убедимся, что родительский элемент раскрыт
    setExpandedFolders(prev => {
      if (!prev.includes(parentId)) {
        return [...prev, parentId];
      }
      return prev;
    });
    
    // Убедимся, что у родительского элемента есть массив children
    setItems(prev => {
      const prepareParent = (items: KnowledgeItem[]): KnowledgeItem[] => {
        return items.map(item => {
          if (item.id === parentId) {
            return {
              ...item,
              children: item.children || []
            };
          }
          if (item.children) {
            return {
              ...item,
              children: prepareParent(item.children)
            };
          }
          return item;
        });
      };
      return prepareParent(prev);
    });
  };

  const handleNewArticle = (type: string, parentId?: string) => {
    setShowNewArticleDialog(false);

    // Если есть родительский элемент, подготовим его для добавления дочерних элементов
    if (parentId) {
      // Проверка на временный ID
      if (parentId.startsWith('temp-')) {
        console.log("ВНИМАНИЕ: Попытка создать файл с временным parentId:", parentId);
        console.log("Рекомендуется сначала сохранить родительский элемент");
      }
      prepareParentForChildren(parentId);
    }

    // Для пустой статьи и roadmap создаем временный файл и сразу включаем режим редактирования
    if (type === 'empty' || type === 'roadmap-item') {
      const tempId = `temp-file-${Date.now()}`;
      
      // Устанавливаем более осмысленное имя по умолчанию
      let defaultName = '';
      if (type === 'empty') {
        defaultName = 'Новая статья';
      } else if (type === 'roadmap-item') {
        defaultName = 'Новый план развития';
      }
      
      // Создаем содержимое файла сразу
      let content = '';
      if (type === 'empty') {
        content = `# ${defaultName}\n\nНачните писать здесь...`;
      } else if (type === 'roadmap-item') {
        content = `### План развития: ${defaultName}\n\n- **Первый этап** [deadline: ${new Date().toISOString().split('T')[0]}]:\n  Описание первого этапа\n\n- **Второй этап**:\n  Описание второго этапа`;
      }
      
      // Создаем временный файл с содержимым для немедленного отображения
      const tempFile: KnowledgeItem = {
        id: tempId,
        itemType: 'file',
        fileType: type === 'empty' ? 'article' : type,
        name: defaultName,
        content: content,
        parentId: parentId || null,
        metadata: type === 'roadmap-item' ? { completedTasks: [] } : undefined
      };
      
      // Добавляем временный файл в состояние
      setItems(prev => {
        if (!parentId) {
          return [...prev, tempFile];
        }

        const addToParent = (items: KnowledgeItem[]): KnowledgeItem[] => {
          return items.map(item => {
            if (item.id === parentId) {
              // Убедимся, что папка раскрыта
              if (!expandedFolders.includes(parentId)) {
                setExpandedFolders(prev => [...prev, parentId]);
              }
              return {
                ...item,
                children: [...(item.children || []), tempFile]
              };
            }
            if (item.children) {
              return {
                ...item,
                children: addToParent(item.children)
              };
            }
            return item;
          });
        };
        return addToParent(prev);
      });

      // Сразу выбираем временный файл для отображения и работы с ним
      setSelectedItem(tempFile);
      
      // Включаем режим редактирования для нового файла
      setIsEditing(tempId);
      setEditName(defaultName);
      setNewFileType(type);
      
      return;
    }

    // Для других типов переходим на соответствующие страницы
    switch (type) {
      case 'article':
        navigate('/articles/regular');
        return;
      case 'notes':
        navigate('/articles/notes');
        return;
      case 'content-plan':
        navigate('/articles/content-plan');
        return;
      case 'simplify':
        navigate('/articles/simplify');
        return;
      case 'reels':
        navigate('/articles/reels');
        return;
    }

    // Асинхронно создаем файл с указанным типом
    saveFile(type, 'Новый файл', parentId);
  };

  const saveFile = async (type: string, fileName: string, parentId?: string) => {
    try {
      let content = '';
      
      // Устанавливаем начальное содержимое в зависимости от типа файла
      if (type === 'empty') {
        content = `# ${fileName}\n\nНачните писать здесь...`;
      } else if (type === 'chat') {
        content = `# ${fileName}\n\n**Система**: Здравствуйте! Как я могу вам помочь?`;
      } else if (type === 'roadmap-item') {
        content = `### План развития: ${fileName}\n\n- **Первый этап** [deadline: ${new Date().toISOString().split('T')[0]}]:\n  Описание первого этапа\n\n- **Второй этап**:\n  Описание второго этапа`;
      }

      // Создаем новый объект файла с временным ID
      const tempId = `temp-file-${Date.now()}`;
      const newFile: KnowledgeItem = {
        id: tempId,
        itemType: 'file',
        fileType: type === 'empty' ? 'article' : type,
        name: fileName,
        content: content,
        parentId: parentId || null,
        metadata: type === 'roadmap-item' ? { completedTasks: [] } : undefined
      };

      // Если файл создается в папке, убедимся, что папка раскрыта
      if (parentId) {
        setExpandedFolders(prev => {
          if (!prev.includes(parentId)) {
            return [...prev, parentId];
          }
          return prev;
        });
      }
      
      // Сначала добавляем временный файл в состояние
      setItems(prev => {
        if (!prev) return [newFile];
        if (!parentId) {
          return [...prev, newFile];
        }
        const updateParent = (items: KnowledgeItem[]): KnowledgeItem[] => {
          return items.map(item => {
            if (item.id === parentId) {
              return {
                ...item,
                children: [...(item.children || []), newFile]
              };
            }
            if (item.children) {
              return {
                ...item,
                children: updateParent(item.children)
              };
            }
            return item;
          });
        };
        return updateParent(prev);
      });
      
      // Выбираем временный файл
      setSelectedItem(newFile);

      // Для отправки на сервер создаем копию без временного ID
      const fileToSave = {
        ...newFile,
        id: '' // Используем пустой ID для сервера
      };

      console.log("Отправляем файл на сервер без временного ID");
      
      // Асинхронно отправляем файл на сервер
      knowledgeApi.save(fileToSave)
        .then(createdFile => {
          console.log("Получен ответ от сервера:", createdFile);
          console.log("Временный ID:", tempId);
          console.log("Постоянный ID:", createdFile?.id);
          
          // Проверяем, что у созданного файла есть ID
          if (!createdFile || !createdFile.id) {
            console.error("Ошибка: Сервер не вернул ID для созданного файла", createdFile);
            showError('Сервер вернул некорректный ответ. Пожалуйста, обновите страницу.');
            return;
          }
          
          // Обновляем состояние, заменяя временный файл на постоянный
          setItems(prev => {
            const updateItems = (items: KnowledgeItem[]): KnowledgeItem[] => {
              return items.map(item => {
                // Если это элемент с временным ID, заменяем его на постоянный
                if (item.id === tempId) {
                  return createdFile;
                }
                // Если элемент является потомком созданного файла, обновляем его parentId
                if (item.parentId === tempId) {
                  console.log(`Обновляем parentId элемента ${item.id} с ${tempId} на ${createdFile.id}`);
                  return {
                    ...item,
                    parentId: createdFile.id
                  };
                }
                // Рекурсивно обрабатываем дочерние элементы
                if (item.children) {
                  return {
                    ...item,
                    children: updateItems(item.children)
                  };
                }
                return item;
              });
            };
            return updateItems(prev);
          });
          
          // Обновляем выбранный файл
          setSelectedItem(prev => {
            if (prev?.id === tempId) {
              return createdFile;
            }
            // Если выбранный элемент является потомком созданного файла, обновляем его parentId
            if (prev?.parentId === tempId) {
              return {
                ...prev,
                parentId: createdFile.id
              };
            }
            return prev;
          });
        })
        .catch(error => {
          console.error("Ошибка при сохранении файла:", error);
          showError('Ошибка при создании файла');
        });
    } catch (error) {
      showError('Ошибка при создании файла');
    }
  };

  const handleTaskToggle = async (index: number) => {
    if (!selectedItem) return;

    try {
      // Инициализируем metadata, если его нет
      const metadata = selectedItem.metadata || {};
      const completedTasks = metadata.completedTasks || [];
      const newCompletedTasks = completedTasks.includes(index)
        ? completedTasks.filter(i => i !== index)
        : [...completedTasks, index];

      const updatedItem = {
        ...selectedItem,
        metadata: {
          ...metadata,
          completedTasks: newCompletedTasks
        }
      };

      await knowledgeApi.updateItem(selectedItem.id, updatedItem);
      setSelectedItem(updatedItem);
    } catch (error) {
      showError('Ошибка при обновлении задачи');
    }
  };

  // Функция для проверки и исправления временных parentId
  const checkAndFixTemporaryParentId = (item: KnowledgeItem): KnowledgeItem => {
    // Проверяем, что переданы корректные данные
    if (!item) {
      console.error('checkAndFixTemporaryParentId: Получен пустой элемент');
      return item;
    }

    if (!item.parentId) {
      return item;
    }

    try {
      // Проверяем наличие временного parentId
      if (item.parentId.startsWith('temp-')) {
        console.log('Обнаружен временный parentId:', item.parentId);
        
        // Попытка найти обновленный ID родительского элемента
        const findUpdatedParentId = (items: KnowledgeItem[], tempParentId: string): string | null => {
          // Проверяем, что массив элементов существует
          if (!items || !Array.isArray(items) || !tempParentId) {
            return null;
          }

          for (const i of items) {
            // Проверяем, что элемент определен и имеет id
            if (!i || !i.id) {
              continue;
            }

            // Если элемент имеет такой же "корень" временного ID, но уже имеет постоянный ID
            if (!i.id.startsWith('temp-') && tempParentId.includes('temp-file-') && i.id.includes(tempParentId.replace('temp-file-', ''))) {
              return i.id;
            }
            
            // Альтернативный подход: ищем элементы с тем же именем и типом, что могли бы быть родителем
            // Это более рискованный подход, но может помочь в некоторых сценариях
            const tempItem = items.find(ti => ti && ti.id === tempParentId);
            if (tempItem && !i.id.startsWith('temp-') && 
                i.name && tempItem.name && i.name === tempItem.name && 
                i.itemType && tempItem.itemType && i.itemType === tempItem.itemType) {
              console.log('Найден потенциальный родитель по имени и типу:', i.id);
              return i.id;
            }
            
            // Рекурсивно проверяем дочерние элементы
            if (i.children && Array.isArray(i.children) && i.children.length > 0) {
              const foundId = findUpdatedParentId(i.children, tempParentId);
              if (foundId) return foundId;
            }
          }
          return null;
        };
        
        // Проверяем, что у нас есть массив items для поиска
        if (!items || !Array.isArray(items)) {
          console.error('checkAndFixTemporaryParentId: Отсутствует массив items для поиска родительского элемента');
          return { ...item, parentId: null };
        }
        
        console.log('Ищем обновленный ID для временного parentId:', item.parentId);
        
        // Ищем обновленный ID родителя
        const updatedParentId = findUpdatedParentId(items, item.parentId);
        
        if (updatedParentId) {
          console.log('Найден обновленный ID для родителя:', updatedParentId);
          return { ...item, parentId: updatedParentId };
        } else {
          console.log('Не удалось найти обновленный ID для родителя, использую null');
          return { ...item, parentId: null };
        }
      }
      
      return item;
    } catch (error) {
      // Обрабатываем возможные ошибки
      console.error('Ошибка при проверке и исправлении временного parentId:', error);
      return { ...item, parentId: null };
    }
  };

  const handleSaveContent = async (targetFolderId?: string | null) => {
    if (!selectedItem) return;

    // Проверяем и исправляем временный parentId
    let itemToSave = checkAndFixTemporaryParentId(selectedItem);
    
    const finalContent = isEditingContent ? editableContent : itemToSave.content || '';
    
    try {
      // Если targetFolderId определен, значит это новый файл или перемещение
      if (targetFolderId !== undefined) {
        const newItem: KnowledgeItem = {
          ...itemToSave,
          content: finalContent,
          parentId: targetFolderId
        };
        
        // Если ID начинается с "temp-", создаем новый файл
        if (selectedItem.id.startsWith('temp-')) {
          // Создаем новый файл через save
          const itemToSave = {
            ...newItem,
            id: ''
          };
          
          console.log("handleSaveContent: Отправляем на сервер с пустым ID:", itemToSave);
          const createdItem = await knowledgeApi.save(itemToSave);
          console.log("handleSaveContent: Получен ответ от сервера:", createdItem);
          
          // Проверяем, что у созданного файла есть ID
          if (!createdItem || !createdItem.id) {
            console.error("handleSaveContent: Сервер не вернул ID для созданного файла", createdItem);
            showError('Сервер вернул некорректный ответ. Пожалуйста, обновите страницу.');
            return;
          }
          
          // Если файл создается в папке, убедимся, что папка раскрыта
          if (targetFolderId) {
            setExpandedFolders(prev => {
              if (!prev.includes(targetFolderId)) {
                return [...prev, targetFolderId];
              }
              return prev;
            });
          }
          
          // Обновляем список файлов, удаляя временный и добавляя новый
          setItems(prev => {
            const removeTemp = (items: KnowledgeItem[]): KnowledgeItem[] => {
              return items.filter(i => {
                if (i.id === selectedItem.id) return false;
                if (i.children) {
                  i.children = removeTemp(i.children);
                }
                return true;
              });
            };
            
            let newItems = removeTemp(prev);
            
            // Добавляем новый файл в нужную папку или в корень
            if (!targetFolderId) {
              newItems = [...newItems, createdItem];
            } else {
              const addToFolder = (items: KnowledgeItem[]): KnowledgeItem[] => {
                return items.map(i => {
                  if (i.id === targetFolderId) {
                    return {
                      ...i,
                      children: [...(i.children || []), createdItem]
                    };
                  }
                  if (i.children) {
                    return { ...i, children: addToFolder(i.children) };
                  }
                  return i;
                });
              };
              newItems = addToFolder(newItems);
            }
            
            return newItems;
          });
          
          // Выбираем новый файл
          setSelectedItem(createdItem);
        } else {
          // Обновляем существующий файл
          console.log("handleSaveContent: Обновляем существующий файл:", selectedItem.id);
          const updatedItem = await knowledgeApi.updateItem(selectedItem.id, newItem);
          
          // Проверяем ответ от сервера
          if (!updatedItem) {
            console.error("handleSaveContent: Сервер не вернул данные обновленного файла");
            showError('Сервер вернул некорректный ответ. Файл мог не обновиться.');
            return;
          }
          
          setSelectedItem(updatedItem);
        }
      } else {
        // Просто обновляем содержимое существующего файла
        const updatedItem = {
          ...itemToSave,
          content: finalContent
        };
        console.log("handleSaveContent: Обновляем содержимое файла:", selectedItem.id);
        const result = await knowledgeApi.updateItem(selectedItem.id, updatedItem);
        
        // Проверяем ответ от сервера
        if (!result) {
          console.error("handleSaveContent: Сервер не вернул данные после обновления");
          showError('Сервер вернул некорректный ответ. Содержимое могло не сохраниться.');
          return;
        }
        
        setSelectedItem(result);
      }
      
      setIsEditingContent(false);
    } catch (error) {
      console.error("handleSaveContent: Ошибка при сохранении:", error);
      showError('Ошибка при сохранении');
    }
  };

  const toggleEditMode = () => {
    if (!isEditingContent) {
      setEditableContent(selectedItem?.content || '');
    } else {
      handleSaveContent();
    }
    setIsEditingContent(!isEditingContent);
  };

  const addNewFolder = (parentId?: string) => {
    // Проверка на временный ID
    if (parentId && parentId.startsWith('temp-')) {
      console.log("ВНИМАНИЕ: Попытка создать папку с временным parentId:", parentId);
      console.log("Рекомендуется сначала сохранить родительский элемент");
    }
    
    // Генерируем временный ID для немедленного отображения
    const tempId = `temp-folder-${Date.now()}`;
    
    // Устанавливаем название новой папки
    const defaultFolderName = 'Новая папка';
    
    // Создаем новую папку с временным ID
    const newFolder: KnowledgeItem = {
      id: tempId,
      itemType: 'folder',
      name: defaultFolderName,
      content: '',
      children: [],
      parentId: parentId || null
    };
    
    // Добавляем папку в состояние сразу с временным ID
    setItems(prevItems => {
      // Если есть родительская папка, добавляем в неё
      if (parentId) {
        // Функция для поиска и обновления родительской папки
        const addToParent = (items: KnowledgeItem[]): KnowledgeItem[] => {
          return items.map(item => {
            if (item.id === parentId) {
              // Добавляем новую папку в дочерние элементы родителя
              return {
                ...item,
                children: [...(item.children || []), newFolder]
              };
            }
            
            // Если у текущего элемента есть дочерние элементы, ищем в них
            if (item.children && item.children.length > 0) {
              return {
                ...item,
                children: addToParent(item.children)
              };
            }
            
            // Возвращаем элемент без изменений
            return item;
          });
        };
        
        return addToParent(prevItems);
      } else {
        // Если нет родительской папки, добавляем в корень
        return [...prevItems, newFolder];
      }
    });
    
    // Если добавляем в папку, раскрываем эту папку
    if (parentId) {
      setExpandedFolders(prev => {
        if (!prev.includes(parentId)) {
          return [...prev, parentId];
        }
        return prev;
      });
    }
    
    // Включаем режим редактирования для новой папки
    setSelectedItem(newFolder);
    setIsEditing(tempId);
    setEditName('Новая папка');
    
    // Важно: не отправляем запрос на сервер сразу!
    // Запрос будет отправлен только после того, как пользователь 
    // закончит редактирование имени в функции handleSaveEdit
  };

  const handleSaveEdit = async (item: KnowledgeItem) => {
    if (!editName.trim() || !isEditing) return;
     
    // Проверяем наличие ID у элемента
    if (!item || !item.id) {
      console.error('Попытка сохранить элемент без ID:', item);
      showError('Ошибка при сохранении: элемент не имеет идентификатора');
      setIsEditing(null);
      return;
    }

    // Проверяем и исправляем временный parentId
    let itemToEdit = checkAndFixTemporaryParentId(item);

    try {
      // Новое имя файла из поля редактирования
      const newName = editName.trim();
      
      // Если ID начинается с temp-, значит это новый элемент
      const isNewItem = itemToEdit.id.startsWith('temp-');
      const isNewFile = itemToEdit.id.startsWith('temp-file-');
      const isNewFolder = itemToEdit.id.startsWith('temp-folder-');
      
      // Логируем параметры для отладки
      console.log('Сохранение элемента:', {
        id: item.id,
        isNewItem,
        isNewFile,
        isNewFolder,
        itemType: item.itemType,
        newName
      });
      
      const isFileWithTempId = item.itemType !== 'folder' && item.id.startsWith('temp-');
     
      // Кейс: Новый файл с временным ID - отправляем полное содержимое
      if (isFileWithTempId) {
        // Создаем копию элемента с обновленным именем, готовую для сохранения на сервера
        const itemToSave = {
          ...itemToEdit,
          name: newName,
          id: '' // Используем пустой ID для сервера
        };
        
        // Получаем временный ID для последующего обновления в UI
        const tempId = item.id;
        console.log("Начинаем обработку сохранения файла с временным ID:", tempId);
        console.log("Отправляем на сервер с пустым ID:", itemToSave);
        
        // Обновляем имя временного файла в UI немедленно
        setItems(prev => {
          const updateTempName = (items: KnowledgeItem[]): KnowledgeItem[] => {
            return items.map(i => {
              if (i.id === tempId) {
                return {
                  ...i,
                  name: newName
                };
              }
              if (i.children && i.children.length > 0) {
                return {
                  ...i,
                  children: updateTempName(i.children)
                };
              }
              return i;
            });
          };
          return updateTempName(prev);
        });
        
        // Обновляем имя выбранного элемента, если это тот же самый
        if (selectedItem?.id === tempId) {
          setSelectedItem(prev => ({
            ...prev!,
            name: newName
          }));
        }
        
        // Выходим из режима редактирования
        setIsEditing(null);
        
        // Асинхронно отправляем запрос на сервер для сохранения
        knowledgeApi.save(itemToSave)
          .then(savedItem => {
            console.log("Получен ответ от сервера с постоянным ID:", savedItem?.id);
            
            // Проверка успешного ответа от сервера и наличия ID
            if (savedItem && savedItem.id) {
              console.log("Начинаем обновление состояния: замена временного ID на постоянный");
              console.log("Временный ID ->", tempId);
              console.log("Постоянный ID ->", savedItem.id);
              
              // ПОЛНОСТЬЮ ОБНОВЛЯЕМ СОСТОЯНИЕ с новым постоянным ID
              setItems(prev => {
                // Создаем глубокую копию состояния, чтобы избежать проблем с мутациями
                const newState = JSON.parse(JSON.stringify(prev));
                console.log("Создана глубокая копия состояния");
                
                const updateItemsState = (items: KnowledgeItem[]): KnowledgeItem[] => {
                  return items.map(i => {
                    // Если нашли элемент с временным ID, заменяем его полностью
                    if (i.id === tempId) {
                      console.log("Найден элемент с временным ID для замены:", i.id);
                      // Возвращаем новый объект с постоянным ID, сохраняя все свойства
                      return {
                        ...i,
                        id: savedItem.id
                      };
                    }
                    
                    // Обновляем parentId, если он ссылается на временный ID
                    if (i.parentId === tempId) {
                      console.log("Обновляем parentId с временного на постоянный:", i.id, "parentId:", tempId, "->", savedItem.id);
                      return {
                        ...i,
                        parentId: savedItem.id
                      };
                    }
                    
                    // Если есть дочерние элементы, рекурсивно обрабатываем их
                    if (i.children && i.children.length > 0) {
                      return {
                        ...i,
                        children: updateItemsState(i.children)
                      };
                    }
                    
                    return i;
                  });
                };
                
                // Применяем функцию обновления к копии состояния
                const updatedState = updateItemsState(newState);
                console.log("Состояние обновлено с новыми ID");
                return updatedState;
              });
              
              // Обновляем выбранный файл если он совпадает с временным
              if (selectedItem?.id === tempId) {
                console.log("Обновляем ID выбранного элемента (файл):", tempId, "->", savedItem.id);
                
                // Обновляем ID выбранного файла, создавая новый объект
                setSelectedItem({
                  ...selectedItem,
                  id: savedItem.id
                });
                
                console.log("ID выбранного элемента после обновления:", selectedItem?.id);
                
                // Добавим отложенную проверку для подтверждения обновления
                setTimeout(() => {
                  console.log("Проверка ID выбранного элемента через setTimeout (файл):", selectedItem?.id);
                }, 500);
              }
              // Также проверяем, не является ли выбранный элемент дочерним для обновляемого
              else if (selectedItem?.parentId === tempId) {
                console.log("Обновляем parentId выбранного элемента:", selectedItem.id, "parentId:", tempId, "->", savedItem.id);
                
                // Обновляем parentId выбранного элемента
                setSelectedItem({
                  ...selectedItem,
                  parentId: savedItem.id
                });
              }
            } else {
              console.error("Ошибка: Не получен корректный ID с сервера", savedItem);
              showError('Сервер вернул некорректный ответ при сохранении. Пожалуйста, обновите страницу.');
            }
          })
          .catch(error => {
            console.error("Ошибка при создании файла:", error);
            showError('Ошибка при создании файла');
            
            // Можно добавить дополнительную логику для отката изменений в случае ошибки
          });
          
        // Возвращаемся, чтобы не выполнять следующие шаги
        return;
      }

      // Если это не файл с временным ID, значит это существующий элемент или другой тип временного элемента
      if (!isFileWithTempId) {
        try {
          console.log("Обновление существующего элемента или другого типа временного элемента:", item.id);
          
          // Обновляем существующий элемент
          const updatedItem = {
            ...itemToEdit,
            name: newName.trim()
          };
          
          // Полная копия для отладки
          console.log("Отправляем на сервер:", JSON.stringify(updatedItem));
          
          // Для обычного элемента - обновляем только имя
          if (!item.id.startsWith('temp-')) {
            console.log("Обновляем существующий элемент:", item.id);
            const savedItem = await knowledgeApi.updateItem(item.id, updatedItem);
            
            // Обновляем состояние
            setItems(prev => {
              // Для обновления существующих элементов
              const updateItem = (items: KnowledgeItem[]): KnowledgeItem[] => {
                return items.map(i => {
                  if (i.id === item.id) {
                    return {
                      ...i,
                      name: newName
                    };
                  }
                  if (i.children) {
                    return {
                      ...i,
                      children: updateItem(i.children)
                    };
                  }
                  return i;
                });
              };
              return updateItem(prev);
            });
          } else {
            // Для временного элемента, который не файл - создаем новый
            console.log("Создаем новый элемент из временного:", item.id);
            
            // Создаем копию для отправки на сервер с пустым ID
            const itemToSaveToServer = {
              ...updatedItem,
              id: '' // Используем пустой ID для сервера
            };
            
            // Получаем текущий временный ID
            const tempId = item.id;
            console.log("Временный ID элемента:", tempId);
            
            // Завершаем редактирование перед отправкой запроса
            setIsEditing(null);
            setNewFileType('');
            
            // Обновляем имя временной папки в UI немедленно
            setItems(prev => {
              const updateTempName = (items: KnowledgeItem[]): KnowledgeItem[] => {
                return items.map(i => {
                  if (i.id === tempId) {
                    return {
                      ...i,
                      name: newName
                    };
                  }
                  if (i.children && i.children.length > 0) {
                    return {
                      ...i,
                      children: updateTempName(i.children)
                    };
                  }
                  return i;
                });
              };
              return updateTempName(prev);
            });
            
            // Обновляем имя выбранного элемента, если это тот же самый
            if (selectedItem?.id === tempId) {
              setSelectedItem(prev => ({
                ...prev!,
                name: newName
              }));
            }
            
            console.log("Отправляем на сервер с пустым ID:", itemToSaveToServer);
            
            // Асинхронно отправляем запрос на сервер для сохранения папки
            knowledgeApi.save(itemToSaveToServer)
              .then(savedItem => {
                console.log("Получен ответ от сервера с постоянным ID:", savedItem?.id);
                
                // Проверка успешного ответа от сервера и наличия ID
                if (savedItem && savedItem.id) {
                  console.log("Начинаем обновление состояния: замена временного ID на постоянный");
                  console.log("Временный ID ->", tempId);
                  console.log("Постоянный ID ->", savedItem.id);
                  
                  // ПОЛНОСТЬЮ ОБНОВЛЯЕМ СОСТОЯНИЕ с новым постоянным ID
                  setItems(prev => {
                    // Создаем глубокую копию состояния
                    const newState = JSON.parse(JSON.stringify(prev));
                    console.log("Создана глубокая копия состояния для обновления другого типа временного элемента");
                    
                    const updateItemsState = (items: KnowledgeItem[]): KnowledgeItem[] => {
                      return items.map(i => {
                        // Если нашли элемент с временным ID, заменяем его полностью
                        if (i.id === tempId) {
                          console.log("Найден элемент с временным ID для замены:", i.id);
                          // Возвращаем новый объект с постоянным ID, сохраняя все свойства
                          return {
                            ...i,
                            id: savedItem.id
                          };
                        }
                        
                        // Обновляем parentId, если он ссылается на временный ID
                        if (i.parentId === tempId) {
                          console.log("Обновляем parentId с временного на постоянный:", i.id, "parentId:", tempId, "->", savedItem.id);
                          return {
                            ...i,
                            parentId: savedItem.id
                          };
                        }
                        
                        // Если есть дочерние элементы, рекурсивно обрабатываем их
                        if (i.children && i.children.length > 0) {
                          return {
                            ...i,
                            children: updateItemsState(i.children)
                          };
                        }
                        
                        return i;
                      });
                    };
                    
                    // Применяем функцию обновления к копии состояния
                    const updatedState = updateItemsState(newState);
                    console.log("Состояние обновлено с новыми ID для другого типа временного элемента");
                    return updatedState;
                  });
                  
                  // Обновляем выбранный элемент если он совпадает с временным
                  if (selectedItem?.id === tempId) {
                    console.log("Обновляем ID выбранного элемента:", tempId, "->", savedItem.id);
                    
                    // Обновляем ID выбранного файла, создавая новый объект
                    setSelectedItem({
                      ...selectedItem,
                      id: savedItem.id
                    });
                    
                    console.log("ID выбранного элемента после обновления:", selectedItem?.id);
                    
                    // Добавим отложенную проверку для подтверждения обновления
                    setTimeout(() => {
                      console.log("Проверка ID выбранного элемента через setTimeout:", selectedItem?.id);
                    }, 500);
                  }
                  // Также проверяем, не является ли выбранный элемент дочерним для обновляемого
                  else if (selectedItem?.parentId === tempId) {
                    console.log("Обновляем parentId выбранного элемента:", selectedItem.id, "parentId:", tempId, "->", savedItem.id);
                    
                    // Обновляем parentId выбранного элемента
                    setSelectedItem({
                      ...selectedItem,
                      parentId: savedItem.id
                    });
                  }
                } else {
                  console.error("Ошибка: Не получен корректный ID с сервера", savedItem);
                  showError('Сервер вернул некорректный ответ при сохранении. Пожалуйста, обновите страницу.');
                }
              })
              .catch(error => {
                console.error("Ошибка при создании папки:", error);
                showError('Ошибка при создании папки');
              });
              
            // Не ждем завершения запроса, продолжаем выполнение
            return;
          }
        } catch (error) {
          console.error("Ошибка при обновлении элемента:", error);
          showError('Ошибка при обновлении элемента');
        }
      }
    } catch (error) {
      showError('Ошибка при сохранении файла');
      console.error('Ошибка при сохранении файла:', error);
    }
    
    // Сбрасываем режим редактирования
    setIsEditing(null);
    setNewFileType('');
  };

  const handleMoveItem = async (targetFolderId: string | null) => {
    if (!moveDialogItem) return;
    
    // Сохраняем копию элемента для перемещения
    const itemToMove = { ...moveDialogItem };
    
    // Сразу закрываем диалог перемещения
    setMoveDialogItem(null);
    
    // Если перемещаем в папку, убедимся, что она раскрыта
    if (targetFolderId) {
      setExpandedFolders(prev => {
        if (!prev.includes(targetFolderId)) {
          return [...prev, targetFolderId];
        }
        return prev;
      });
    }
    
    // Обновляем UI немедленно, не дожидаясь ответа от сервера
    const oldParentId = itemToMove.parentId;
    
    // Создаем копию элемента с обновленным parentId
    const updatedItem = {
      ...itemToMove,
      parentId: targetFolderId
    };
    
    // Обновляем состояние локально
    setItems(prev => {
      // Функция для удаления элемента из старого местоположения
      const removeFromOld = (items: KnowledgeItem[]): KnowledgeItem[] => {
        return items.filter(item => {
          if (item.id === itemToMove.id) {
            return false;
          }
          
          if (item.children) {
            item.children = removeFromOld(item.children);
          }
          
          return true;
        });
      };
      
      // Удаляем элемент из старого местоположения
      let newItems = removeFromOld(prev);
      
      // Функция для добавления элемента в новое местоположение
      const addToNew = (items: KnowledgeItem[]): KnowledgeItem[] => {
        if (!targetFolderId) {
          // Если перемещаем в корень
          return [...items, updatedItem];
        }
        
        return items.map(item => {
          if (item.id === targetFolderId) {
            return {
              ...item,
              children: [...(item.children || []), updatedItem]
            };
          }
          
          if (item.children) {
            return {
              ...item,
              children: addToNew(item.children)
            };
          }
          
          return item;
        });
      };
      
      // Добавляем элемент в новое местоположение
      return addToNew(newItems);
    });
    
    // Если элемент был выбран, обновляем его в выбранном состоянии
    if (selectedItem && selectedItem.id === itemToMove.id) {
      setSelectedItem(updatedItem);
    }
    
    // Отправляем запрос на перемещение в фоновом режиме
    try {
      await knowledgeApi.moveItem(itemToMove.id, targetFolderId, itemToMove.itemType);
      // Успешно перемещено на сервере, ничего делать не нужно
    } catch (error) {
      // Если запрос не удался, показываем ошибку
      showError('Ошибка при перемещении элемента на сервере. Изменения могут быть потеряны после перезагрузки страницы.');
      // При желании можно добавить обновление списка с сервера
      // loadItems();
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: KnowledgeItem) => {
    e.preventDefault();
    
    // Определяем размеры экрана и положение меню
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const menuHeight = 220; // Примерная высота меню
    const menuWidth = 180;  // Примерная ширина меню
    
    // Если меню выходит за нижнюю границу экрана, поднимаем его выше
    const yPosition = e.clientY + menuHeight > windowHeight 
      ? windowHeight - menuHeight - 10 // Отступ 10px от низа экрана
      : e.clientY;
    
    // Если меню выходит за правую границу экрана, смещаем его влево
    const xPosition = e.clientX + menuWidth > windowWidth
      ? windowWidth - menuWidth - 10 // Отступ 10px от правого края
      : e.clientX;
    
    setContextMenu({
      x: xPosition,
      y: yPosition,
      item
    });
  };

  const handleEdit = (item: KnowledgeItem) => {
    setIsEditing(item.id);
    setEditName(item.name);
    setContextMenu(null);
  };

  const handleDelete = (item: KnowledgeItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
    setContextMenu(null);
  };

  const handleMove = (item: KnowledgeItem) => {
    setMoveDialogItem(item);
    setContextMenu(null);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    // Сохраняем копию элемента для удаления
    const itemToDeleteCopy = { ...itemToDelete };
    
    // Сразу закрываем диалог и очищаем состояние
    setShowDeleteDialog(false);
    setItemToDelete(null);
    
    // Если удаляемый элемент был выбран, сбрасываем выбор
    if (selectedItem && selectedItem.id === itemToDeleteCopy.id) {
      setSelectedItem(null);
    }
    
    // Обновляем UI немедленно, не дожидаясь ответа от сервера
    setItems(prev => {
      const removeItem = (items: KnowledgeItem[]): KnowledgeItem[] => {
        return items.filter(item => {
          if (item.id === itemToDeleteCopy.id) {
            return false;
          }
          
          if (item.children) {
            item.children = removeItem(item.children);
          }
          
          return true;
        });
      };
      
      return removeItem(prev);
    });
    
    // Отправляем запрос на удаление в фоновом режиме
    try {
      await knowledgeApi.deleteItem(itemToDeleteCopy.id);
      // Успешно удалено на сервере, ничего делать не нужно
    } catch (error) {
      // Если запрос не удался, показываем ошибку, но не восстанавливаем удаленный элемент
      showError('Ошибка при удалении элемента на сервере. Элемент может восстановиться после перезагрузки страницы.');
    }
  };

  const parseMessages = (content: string): ChatMessage[] => {
    const messages: ChatMessage[] = [];
    const lines = content.split('\n');
    let currentSender: ChatParticipant | null = null;
    let currentContent = '';

    lines.forEach(line => {
      if (line.startsWith('**') && line.includes('**:')) {
        if (currentSender && currentContent.trim()) {
          messages.push({
            id: messages.length.toString(),
            sender: currentSender,
            content: currentContent.trim(),
            timestamp: new Date()
          });
          currentContent = '';
        }

        const senderName = line.replace(/^\*\*(.*?)\*\*:.*$/, '$1').trim();
        currentSender = {
          id: senderName.toLowerCase().replace(/\s+/g, '_'),
          name: senderName,
          role: senderName === 'Пользователь' ? 'Пользователь' : 'Эксперт',
          isOnline: false
        };
        currentContent = line.replace(/^\*\*(.*?)\*\*:\s*/, '') + '\n';
      } else if (currentSender) {
        currentContent += line + '\n';
      }
    });

    if (currentSender && currentContent.trim()) {
      messages.push({
        id: messages.length.toString(),
        sender: currentSender,
        content: currentContent.trim(),
        timestamp: new Date()
      });
    }

    return messages;
  };

  const parseReels = (content: string | undefined): any[] => {
    if (!content) {
      return [];
    }
    
    try {
      const parsedData = JSON.parse(content);
      return parsedData;
    } catch (error) {
      return [];
    }
  };

  const parseContentPlan = (content: string | undefined): any => {
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  };

  const handleSelectItem = async (item: KnowledgeItem) => {
    try {
      if (!item || !item.id) {
        console.error('handleSelectItem: Получен некорректный элемент без id');
        return;
      }

      // Проверяем, является ли ID временным
      const isTemporary = item.id.startsWith('temp-');
      console.log(`Выбран элемент: ${item.id} (временный: ${isTemporary})`);

      // Проверяем и исправляем временный parentId перед дальнейшей обработкой
      let itemWithFixedParent = { ...item };
      
      // Проверяем, не является ли parentId временным
      if (item.parentId && item.parentId.startsWith('temp-')) {
        console.log('ВНИМАНИЕ: У элемента', item.id, 'временный parentId:', item.parentId);
        console.log('Пытаемся исправить временный parentId...');
        
        try {
          // Используем функцию исправления временного parentId
          itemWithFixedParent = checkAndFixTemporaryParentId(item);
          
          // Обновляем элемент в состоянии, если parentId был исправлен
          if (itemWithFixedParent.parentId !== item.parentId) {
            console.log('Исправлен parentId с', item.parentId, 'на', itemWithFixedParent.parentId);
            
            // Обновляем состояние с исправленным parentId
            setItems(prev => {
              const updateItems = (items: KnowledgeItem[]): KnowledgeItem[] => {
                if (!items || !Array.isArray(items)) return [];
                
                return items.map(i => {
                  if (!i) return i;
                  if (i.id === item.id) {
                    return {
                      ...i,
                      parentId: itemWithFixedParent.parentId
                    };
                  }
                  if (i.children && Array.isArray(i.children)) {
                    return {
                      ...i,
                      children: updateItems(i.children)
                    };
                  }
                  return i;
                });
              };
              return updateItems(prev);
            });
          }
        } catch (error) {
          console.error('Ошибка при исправлении временного parentId:', error);
          // Устанавливаем parentId в null в случае ошибки
          itemWithFixedParent = { ...item, parentId: null };
        }
      }

      // Дополнительная проверка - если ID временный, ищем возможное обновление ID в состоянии
      if (isTemporary) {
        // Просто используем локальное состояние без запроса к серверу
        console.log('Выбран временный элемент:', itemWithFixedParent.id);
        setSelectedItem(itemWithFixedParent);
        return;
      }
      
      // Если выбран элемент типа файл и НЕ временный, загружаем его содержимое
      if (itemWithFixedParent.itemType === 'file') {
        try {
          console.log('Загружаем файл по ID:', itemWithFixedParent.id);
          // Загружаем полное содержимое файла с сервера
          const fullItem = await knowledgeApi.getFile(itemWithFixedParent.id);
          setSelectedItem(fullItem);
        } catch (error) {
          console.error('Ошибка при загрузке файла:', error);
          setSelectedItem(itemWithFixedParent);
          showError('Ошибка при загрузке содержимого файла');
        }
      } else {
        // Для папок просто устанавливаем выбранный элемент из локальных данных
        setSelectedItem(itemWithFixedParent);
      }
      
      // Если выбран элемент, раскрываем все родительские папки
      if (itemWithFixedParent.parentId) {
        try {
          const parentFolders = findParentFolders(items, itemWithFixedParent.id);
          if (parentFolders.length > 0) {
            setExpandedFolders(prev => {
              const newExpanded = [...prev];
              parentFolders.forEach(folderId => {
                if (!newExpanded.includes(folderId)) {
                  newExpanded.push(folderId);
                }
              });
              return newExpanded;
            });
          }
        } catch (error) {
          console.error('Ошибка при раскрытии родительских папок:', error);
        }
      }
    } catch (error) {
      console.error('Неожиданная ошибка при выборе элемента:', error);
      showError('Произошла ошибка при выборе элемента');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!selectedItem) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <FileText className="w-16 h-16 mb-4" />
          <p>Выберите файл для просмотра</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {selectedItem.itemType !== 'folder' && !isChatOpen && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Обсудить содержимое
            </button>
          </div>
        )}

        {isChatOpen && selectedItem.itemType !== 'folder' && (
          <KnowledgeChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            content={selectedItem.content || ''}
            title={selectedItem.name}
            itemId={selectedItem.id.startsWith('temp-') ? 
                  // Если ID временный, добавляем лог и передаем пустую строку вместо временного ID
                  (console.log('Передан временный ID в KnowledgeChat:', selectedItem.id), '') : 
                  selectedItem.id}
          />
        )}

        {selectedItem.itemType === 'folder' ? (
          <div className="p-6 max-w-6xl mx-auto">
            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedItem.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Папка
              </p>
            </div>
          </div>
        ) : selectedItem.fileType === 'roadmap-item' ? (
          <div className="p-6 max-w-6xl mx-auto">
            <GoalViewer
              markdown={selectedItem.content || ''}
              completedTasks={selectedItem.metadata?.completedTasks || []}
              onTaskToggle={handleTaskToggle}
              onMarkdownChange={async (newMarkdown) => {
                // Проверка на временный ID перед обновлением
                if (selectedItem.id.startsWith('temp-')) {
                  console.log('Предотвращено обновление roadmap-item с временным ID:', selectedItem.id);
                  showError('Невозможно обновить файл с временным ID. Пожалуйста, сохраните имя файла сначала.');
                  return;
                }
                
                const updatedItem = {
                  ...selectedItem,
                  content: newMarkdown
                };
                await knowledgeApi.updateItem(selectedItem.id, updatedItem);
                setSelectedItem(updatedItem);
              }}
            />
          </div>
        ) : selectedItem.fileType === 'chat' ? (
          <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800">
            <ChatHistory 
              messages={parseMessages(selectedItem.content || '')}
              currentUserId="user"
            />
          </div>
        ) : selectedItem.fileType === 'reels' ? (
          <div className="p-6 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedItem.name}
            </h2>
            
            <ReelsList 
              reels={parseReels(selectedItem.content)} 
              sourceId={selectedItem.id.startsWith('temp-') ? 
                      // Если ID временный, добавляем лог и передаем пустую строку вместо временного ID
                      (console.log('Передан временный ID в ReelsList:', selectedItem.id), '') : 
                      selectedItem.id}
              onReelsDeleted={() => loadItems()}
            />
          </div>
        ) : selectedItem.fileType === 'content-plan' ? (
          <div className="p-6 max-w-7xl mx-auto">
            <ContentPlanViewer data={parseContentPlan(selectedItem.content)} />
          </div>
        ) : (
          <div className="p-6 max-w-6xl mx-auto">
            <RichTextEditor
              content={isEditingContent ? editableContent : selectedItem.content || ''}
              isEditing={isEditingContent}
              onEdit={toggleEditMode}
              onSave={() => {
                // Дополнительная проверка на временный ID перед сохранением
                if (selectedItem.id.startsWith('temp-')) {
                  console.log('Предотвращена попытка сохранения файла с временным ID:', selectedItem.id);
                  showError('Невозможно сохранить файл с временным ID. Пожалуйста, сохраните имя файла сначала.');
                  return;
                }
                handleSaveContent();
              }}
              onChange={setEditableContent}
              title={selectedItem.name}
              withBackground={true}
              itemId={selectedItem.id.startsWith('temp-') ? 
                     // Если ID временный, добавляем лог и передаем undefined вместо временного ID
                     (console.log('Передан временный ID в RichTextEditor:', selectedItem.id), undefined) : 
                     selectedItem.id}
              format="html"
            />
          </div>
        )}
      </div>
    );
  };

  // Обработчик изменения имени в поле редактирования
  const handleEditNameChange = (value: string) => {
    setEditName(value);
    
    // Немедленно обновляем имя в состоянии без отправки на сервер
    if (isEditing) {
      setItems(prev => {
        const updateItemName = (items: KnowledgeItem[]): KnowledgeItem[] => {
          return items.map(item => {
            if (item.id === isEditing) {
              // Обновляем имя временного файла сразу в UI
              return {
                ...item,
                name: value
              };
            }
            if (item.children && item.children.length > 0) {
              return {
                ...item,
                children: updateItemName(item.children)
              };
            }
            return item;
          });
        };
        return updateItemName(prev);
      });
      
      // Если элемент выбран, обновляем его имя и в selectedItem
      if (selectedItem?.id === isEditing) {
        setSelectedItem(prev => {
          if (prev) {
            return {
              ...prev,
              name: value
            };
          }
          return prev;
        });
      }
    }
  };

  // Добавим функцию для экспорта PDF
  const handleExportPDF = (item: KnowledgeItem) => {
    if (!item || !item.content) return;
    
    // Убедимся, что html2pdf доступен
    if (typeof window.html2pdf === 'undefined') {
      console.error('html2pdf не найден. Убедитесь, что библиотека подключена.');
      return;
    }
    
    const element = document.createElement('div');
    element.className = 'prose max-w-none p-8';
    element.style.color = '#000000';
    
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      * {
        color: #000000 !important;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #000000 !important;
        margin-bottom: 1em;
      }
      p {
        color: #000000 !important;
        margin-bottom: 0.5em;
      }
      a {
        color: #2563eb !important;
        text-decoration: underline;
      }
    `;
    element.appendChild(styleElement);
    
    const titleElement = document.createElement('h1');
    titleElement.style.fontSize = '24px';
    titleElement.style.fontWeight = 'bold';
    titleElement.style.marginBottom = '24px';
    titleElement.style.color = '#000000';
    titleElement.textContent = item.name || 'Документ';
    
    element.appendChild(titleElement);
    
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = item.content;
    element.appendChild(contentDiv);

    const opt = {
      margin: 10,
      filename: `${(item.name || 'document').toLowerCase().replace(/\s+/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // @ts-ignore
      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Ошибка при создании PDF:', error);
    }
    
    // Закрываем контекстное меню
    setContextMenu(null);
  };

  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200 flex flex-col">
      <NavigationMenu />
      <div className="flex-1 flex overflow-hidden">
        <KnowledgeFileStructure
          items={items}
          selectedItem={selectedItem}
          expandedFolders={expandedFolders}
          isEditing={isEditing}
          editName={editName}
          onToggleFolder={toggleFolder}
          onSelectItem={(item) => {
            // Дополнительная проверка на временный ID
            if (item.id.startsWith('temp-')) {
              // Находим элемент в текущем списке на случай, если его ID уже обновился, но ссылка осталась на старый
              const currentItems = [...items];
              const findCurrentItem = (items: KnowledgeItem[], tempId: string): KnowledgeItem | null => {
                for (const i of items) {
                  if (i.id === tempId) {
                    return i;
                  }
                  if (i.children && i.children.length > 0) {
                    const found = findCurrentItem(i.children, tempId);
                    if (found) return found;
                  }
                }
                return null;
              };
              
              const actualItem = findCurrentItem(currentItems, item.id);
              if (actualItem) {
                handleSelectItem(actualItem);
              } else {
                // Если элемент не найден в текущем списке, используем переданный
                handleSelectItem(item);
              }
            } else {
              handleSelectItem(item);
            }
          }}
          onContextMenu={handleContextMenu}
          onEditNameChange={handleEditNameChange}
          onEditSave={handleSaveEdit}
          onAddFile={() => {
            setNewArticleParentId(undefined);
            setShowNewArticleDialog(true);
          }}
          onAddFolder={() => addNewFolder()}
        />

        <div className="flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-y-auto">
          {renderContent()}
        </div>
      </div>

      <NewArticleDialog
        isOpen={showNewArticleDialog}
        onClose={() => setShowNewArticleDialog(false)}
        onSelect={(type, parentId) => handleNewArticle(type, parentId || newArticleParentId)}
        parentId={newArticleParentId}
      />

      <MoveDialog
        isOpen={moveDialogItem !== null}
        onClose={() => setMoveDialogItem(null)}
        onMove={handleMoveItem}
        items={items}
        currentItem={moveDialogItem!}
      />

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed bg-white dark:bg-gray-800 rounded-xl shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-600 ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-sm"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                setNewArticleParentId(contextMenu.item.id);
                setShowNewArticleDialog(true);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center text-gray-900 dark:text-white transition-all"
            >
              <FileText className="w-4 h-4 mr-2 text-blue-500" />
              Новый файл
            </button>
            <button
              onClick={() => {
                addNewFolder(contextMenu.item.id);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center text-gray-900 dark:text-white transition-all"
            >
              <FolderPlus className="w-4 h-4 mr-2 text-blue-500" />
              Новая папка
            </button>
            <button
              onClick={() => handleEdit(contextMenu.item)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center text-gray-900 dark:text-white transition-all"
            >
              <Edit2 className="w-4 h-4 mr-2 text-blue-500" />
              Переименовать
            </button>
            <button
              onClick={() => handleMove(contextMenu.item)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center text-gray-900 dark:text-white transition-all"
            >
              <Move className="w-4 h-4 mr-2 text-blue-500" />
              Переместить
            </button>
            
            {/* Кнопка "Скачать PDF" только для типа article */}
            {contextMenu.item.fileType === 'article' && (
              <button
                onClick={() => handleExportPDF(contextMenu.item)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center text-gray-900 dark:text-white transition-all"
              >
                <FileDown className="w-4 h-4 mr-2 text-blue-500" />
                Скачать PDF
              </button>
            )}
            
            <button
              onClick={() => handleDelete(contextMenu.item)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center text-red-500 transition-all"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {showDeleteDialog && itemToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            ref={deleteDialogRef}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-600 ring-1 ring-black/5 dark:ring-white/10"
          >
            <div className="flex items-center mb-4 text-red-500">
              <Trash2 className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-semibold">Подтверждение удаления</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Вы уверены, что хотите удалить "{itemToDelete.name}"?
              {(itemToDelete.itemType === 'folder' || (itemToDelete.children && itemToDelete.children.length > 0)) && (
                <span className="block mt-2 text-red-500 text-sm">
                  Внимание: все файлы внутри {itemToDelete.itemType === 'folder' ? 'папки' : 'файла'} также будут удалены!
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg shadow-sm hover:shadow transition-all"
              >
                Удалить
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Knowledge;
