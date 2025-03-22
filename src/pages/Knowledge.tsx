import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, 
  Trash2, 
  FolderPlus, 
  Move,
  FileText,
  MessageCircle
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
      prepareParentForChildren(parentId);
    }

    // Для пустой статьи и roadmap создаем временный файл и сразу включаем режим редактирования
    if (type === 'empty' || type === 'roadmap-item') {
      const tempId = `temp-file-${Date.now()}`;
      const defaultName = ''; // Пустое имя, чтобы поле ввода было пустым
      
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

      // Создаем новый файл
      const newFile: KnowledgeItem = {
        id: '',
        itemType: 'file',
        fileType: type === 'empty' ? 'article' : type,
        name: fileName,
        content: content,
        parentId: parentId || null,
        metadata: type === 'roadmap-item' ? { completedTasks: [] } : undefined
      };

      const createdFile = await knowledgeApi.save(newFile);
      
      // Если файл создается в папке, убедимся, что папка раскрыта
      if (parentId) {
        setExpandedFolders(prev => {
          if (!prev.includes(parentId)) {
            return [...prev, parentId];
          }
          return prev;
        });
      }
      
      setItems(prev => {
        if (!prev) return [createdFile];
        if (!parentId) {
          return [...prev, createdFile];
        }
        const updateParent = (items: KnowledgeItem[]): KnowledgeItem[] => {
          return items.map(item => {
            if (item.id === parentId) {
              return {
                ...item,
                children: [...(item.children || []), createdFile]
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
      setSelectedItem(createdFile);
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

  const handleSaveContent = async (targetFolderId?: string | null) => {
    if (!selectedItem) return;

    const finalContent = isEditingContent ? editableContent : selectedItem.content || '';
    
    try {
      // Если targetFolderId определен, значит это новый файл или перемещение
      if (targetFolderId !== undefined) {
        const newItem: KnowledgeItem = {
          ...selectedItem,
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
          const createdItem = await knowledgeApi.save(itemToSave);
          
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
          const updatedItem = await knowledgeApi.updateItem(selectedItem.id, newItem);
          setSelectedItem(updatedItem);
        }
      } else {
        // Просто обновляем содержимое существующего файла
        const updatedItem = {
          ...selectedItem,
          content: finalContent
        };
        await knowledgeApi.updateItem(selectedItem.id, updatedItem);
        setSelectedItem(updatedItem);
      }
      
      setIsEditingContent(false);
    } catch (error) {
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
    // Если есть родительский элемент, подготовим его для добавления дочерних элементов
    if (parentId) {
      prepareParentForChildren(parentId);
    }

    // Создаем новую папку сразу через API
    const newFolder: KnowledgeItem = {
      id: '',
      itemType: 'folder',
      name: 'Новая папка',
      children: [],
      parentId: parentId || null
    };

    // Отправляем на сервер
    knowledgeApi.save(newFolder)
      .then(createdFolder => {
        // Если указан parentId, убедимся, что родительская папка раскрыта
        if (parentId) {
          setExpandedFolders(prev => {
            if (!prev.includes(parentId)) {
              return [...prev, parentId];
            }
            return prev;
          });
        }
        
        // Добавляем созданную папку в состояние
        setItems(prev => {
          if (!parentId) {
            return [...prev, createdFolder];
          }

          const addToParent = (items: KnowledgeItem[]): KnowledgeItem[] => {
            return items.map(item => {
              if (item.id === parentId) {
                return {
                  ...item,
                  children: [...(item.children || []), createdFolder]
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

        // Включаем режим редактирования для новой папки
        setIsEditing(createdFolder.id);
        setEditName('Новая папка');
      })
      .catch(error => {
        showError('Ошибка при создании папки');
      });
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

    try {
      // Если ID начинается с temp-, значит это новый элемент
      const isNewItem = item.id.startsWith('temp-');
      const isNewFile = item.id.startsWith('temp-file-');
      
      // Если это временный файл без имени, то создаем имя и отправляем на сервер
      if (isNewFile) {
        // Сначала обновляем локальное состояние для быстрого отображения
        const updatedName = editName.trim();
        
        // Обновляем содержимое при необходимости
        let updatedContent = item.content || '';
        if (newFileType === 'empty' && item.content) {
          // Если это был новый файл с заглушкой имени, обновляем имя в содержимом
          updatedContent = item.content.replace(/^# .*$/m, `# ${updatedName}`);
        } else if (newFileType === 'roadmap-item' && item.content) {
          // Если это был план развития, обновляем имя в содержимом
          updatedContent = item.content.replace(/^### План развития: .*$/m, `### План развития: ${updatedName}`);
        }
        
        // Временно обновляем состояние для мгновенного отображения
        const updatedTempItem = {
          ...item,
          name: updatedName,
          content: updatedContent
        };
        
        // Обновляем локальное состояние без ожидания ответа от сервера
        setItems(prev => {
          const updateItem = (items: KnowledgeItem[]): KnowledgeItem[] => {
            return items.map(i => {
              if (i.id === item.id) {
                // Обновляем выбранный файл, если он совпадает с редактируемым
                if (selectedItem?.id === item.id) {
                  setSelectedItem(updatedTempItem);
                }
                return updatedTempItem;
              }
              if (i.children) {
                return { ...i, children: updateItem(i.children) };
              }
              return i;
            });
          };
          return updateItem(prev);
        });
        
        // Выходим из режима редактирования
        setIsEditing(null);
        
        // Всегда сохраняем файл на сервере
        try {
          // Создаем объект для сохранения на сервере
          const newFile: KnowledgeItem = {
            id: '',
            itemType: 'file',
            fileType: newFileType === 'empty' ? 'article' : newFileType,
            name: updatedName,
            content: updatedContent,
            parentId: item.parentId,
            metadata: newFileType === 'roadmap-item' ? { completedTasks: [] } : undefined
          };
          
          // Отправляем запрос на сервер
          const savedItem = await knowledgeApi.save(newFile);
          
          // Получаем текущий временный ID файла
          const tempId = item.id;
          // Получаем ID родительской папки
          const parentId = item.parentId;
          
          // Проверяем, что сервер вернул корректный ответ
          if (savedItem && savedItem.id) {
            // Создаем объект с обновленными данными
            const resultItem: KnowledgeItem = {
              ...savedItem,
              name: updatedName,
              content: updatedContent
            };
            
            // После получения ответа обновляем ID файла
            setItems(prev => {
              // Удаляем временный элемент
              const removeTemp = (items: KnowledgeItem[]): KnowledgeItem[] => {
                return items.filter(i => {
                  if (i.id === tempId) return false;
                  if (i.children) {
                    i.children = removeTemp(i.children);
                  }
                  return true;
                });
              };
              
              let updatedItems = removeTemp(prev);
              
              // Обновляем выбранный файл
              if (selectedItem?.id === tempId) {
                setSelectedItem(resultItem);
                
                // Если файл в папке, убедимся, что папка раскрыта
                if (parentId) {
                  setExpandedFolders(prev => {
                    if (!prev.includes(parentId)) {
                      return [...prev, parentId];
                    }
                    return prev;
                  });
                }
                
                // Включаем режим редактирования содержимого сразу после сохранения имени
                if (newFileType === 'empty' || newFileType === 'roadmap-item') {
                  setTimeout(() => {
                    setEditableContent(resultItem.content || '');
                    setIsEditingContent(true);
                  }, 100);
                }
              }
              
              // Добавляем новый элемент с реальным ID
              if (!parentId) {
                // Если нет родителя, добавляем в корень
                return [...updatedItems, resultItem];
              } else {
                // Если есть родитель, добавляем к соответствующей папке
                const addToParent = (items: KnowledgeItem[]): KnowledgeItem[] => {
                  return items.map(i => {
                    if (i.id === parentId) {
                      return {
                        ...i,
                        children: [...(i.children || []), resultItem]
                      };
                    }
                    if (i.children) {
                      return {
                        ...i,
                        children: addToParent(i.children)
                      };
                    }
                    return i;
                  });
                };
                return addToParent(updatedItems);
              }
            });
          }
        } catch (error) {
        }
        
        setNewFileType('');
        return;
      }
      
      let savedItem;
      if (isNewItem) {
        // Создаем новую папку
        const newFolder: KnowledgeItem = {
          id: '',
          itemType: 'folder',
          name: editName.trim(),
          children: [],
          parentId: item.parentId
        };
        savedItem = await knowledgeApi.save(newFolder);
      } else {
        // Обновляем существующий элемент
        const updatedItem = {
          ...item,
          name: editName.trim()
        };
        savedItem = await knowledgeApi.updateItem(item.id, updatedItem);
      }

      // Обновляем состояние
      setItems(prev => {
        if (isNewItem) {
          // Для новых элементов: удаляем временный элемент и добавляем новый с правильным ID
          const tempId = item.id;
          const parentId = item.parentId;
          
          // Сначала удаляем временный элемент
          const removeTemp = (items: KnowledgeItem[]): KnowledgeItem[] => {
            return items.filter(i => {
              if (i.id === tempId) return false;
              if (i.children) {
                i.children = removeTemp(i.children);
              }
              return true;
            });
          };
          
          let updatedItems = removeTemp(prev);
          
          // Затем добавляем новый элемент с реальным ID
          if (!parentId) {
            // Если нет родителя, добавляем в корень
            return [...updatedItems, savedItem];
          } else {
            // Если есть родитель, добавляем к соответствующей папке
            const addToParent = (items: KnowledgeItem[]): KnowledgeItem[] => {
              return items.map(i => {
                if (i.id === parentId) {
                  return {
                    ...i,
                    children: [...(i.children || []), savedItem]
                  };
                }
                if (i.children) {
                  return {
                    ...i,
                    children: addToParent(i.children)
                  };
                }
                return i;
              });
            };
            return addToParent(updatedItems);
          }
        } else {
          // Для обновления существующих элементов используем старую логику
          const updateItem = (items: KnowledgeItem[]): KnowledgeItem[] => {
            return items.map(i => {
              if (i.id === item.id) {
                return {
                  ...savedItem,
                  itemType: savedItem.itemType || i.itemType
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
        }
      });

      // Если это была новая папка, выбираем её
      if (isNewItem) {
        setSelectedItem(savedItem);
      }
    } catch (error) {
      showError(item.id.startsWith('temp-file-') ? 'Ошибка при создании файла' : 
                item.id.startsWith('temp-') ? 'Ошибка при создании папки' : 
                'Ошибка при обновлении');
      
      // В случае ошибки при создании нового элемента удаляем его из состояния
      if (item.id.startsWith('temp-')) {
        setItems(prev => {
          const removeItem = (items: KnowledgeItem[]): KnowledgeItem[] => {
            return items.filter(i => {
              if (i.id === item.id) return false;
              if (i.children) {
                i.children = removeItem(i.children);
              }
              return true;
            });
          };
          return removeItem(prev);
        });
      }
    }
    
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
    // Если выбран элемент типа файл, загружаем его содержимое
    if (item.itemType === 'file') {
      try {
        // Загружаем полное содержимое файла с сервера
        const fullItem = await knowledgeApi.getFile(item.id);
        setSelectedItem(fullItem);
      } catch (error) {
        setSelectedItem(item);
        showError('Ошибка при загрузке содержимого файла');
      }
    } else {
      setSelectedItem(item);
    }
    
    // Если выбран элемент, раскрываем все родительские папки
    if (item.parentId) {
      const parentFolders = findParentFolders(items, item.id);
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
            itemId={selectedItem.id}
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
              sourceId={selectedItem.id}
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
              onSave={handleSaveContent}
              onChange={setEditableContent}
              title={selectedItem.name}
              withBackground={true}
              itemId={selectedItem.id}
              format="html"
            />
          </div>
        )}
      </div>
    );
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
          onSelectItem={handleSelectItem}
          onContextMenu={handleContextMenu}
          onEditNameChange={(value) => setEditName(value)}
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
