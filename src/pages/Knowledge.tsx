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
      console.log('Loading knowledge items...');
      setIsLoading(true);
      const data = await knowledgeApi.getItems();
      console.log('Received items:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        setItems(data);
        console.log('Items set successfully');
      } else {
        console.warn('No items received or empty array');
        setItems([]);
      }
    } catch (error) {
      console.error('Error loading items:', error);
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

  const handleNewArticle = (type: string, parentId?: string) => {
    setShowNewArticleDialog(false);

    // Для пустой статьи и roadmap создаем временный файл и сразу включаем режим редактирования
    if (type === 'empty' || type === 'roadmap-item') {
      const tempId = `temp-file-${Date.now()}`;
      const defaultName = type === 'empty' ? 'Новая статья' : 'Новый план';
      
      // Добавляем временный файл в состояние
      setItems(prev => {
        const newFile: KnowledgeItem = {
          id: tempId,
          itemType: 'file',
          fileType: type === 'empty' ? 'article' : type,
          name: defaultName,
          parentId: parentId || null
        };

        if (!parentId) {
          return [...prev, newFile];
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
                children: [...(item.children || []), newFile]
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
      console.error('Error creating file:', error);
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
      console.error('Error updating task:', error);
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

    try {
      // Если ID начинается с temp-, значит это новый элемент
      const isNewItem = item.id.startsWith('temp-');
      const isNewFile = item.id.startsWith('temp-file-');
      
      let savedItem;
      if (isNewFile) {
        // Создаем новый файл
        let content = '';
        
        // Устанавливаем начальное содержимое в зависимости от типа файла
        if (newFileType === 'empty') {
          content = `# ${editName}\n\nНачните писать здесь...`;
        } else if (newFileType === 'roadmap-item') {
          content = `### План развития: ${editName}\n\n- **Первый этап** [deadline: ${new Date().toISOString().split('T')[0]}]:\n  Описание первого этапа\n\n- **Второй этап**:\n  Описание второго этапа`;
        }
        
        const newFile: KnowledgeItem = {
          id: '',
          itemType: 'file',
          fileType: newFileType === 'empty' ? 'article' : newFileType,
          name: editName.trim(),
          content: content,
          parentId: item.parentId,
          metadata: newFileType === 'roadmap-item' ? { completedTasks: [] } : undefined
        };
        
        savedItem = await knowledgeApi.save(newFile);
      } else if (isNewItem) {
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
        const updateItem = (items: KnowledgeItem[]): KnowledgeItem[] => {
          return items.map(i => {
            if (i.id === item.id) {
              // Важно: сохраняем тип элемента при обновлении
              return {
                ...savedItem,
                itemType: isNewItem && !isNewFile ? 'folder' : savedItem.itemType || i.itemType
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

      // Если это был новый файл, выбираем его
      if (isNewFile) {
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
    setMoveDialogItem(null);

    try {
      await knowledgeApi.moveItem(moveDialogItem.id, targetFolderId, moveDialogItem.itemType);
      
      // Если перемещаем в папку, убедимся, что она раскрыта
      if (targetFolderId) {
        setExpandedFolders(prev => {
          if (!prev.includes(targetFolderId)) {
            return [...prev, targetFolderId];
          }
          return prev;
        });
      }

      // Обновляем список после перемещения
      loadItems();
    } catch (error) {
      console.error('Error moving item:', error);
      showError('Ошибка при перемещении элемента');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: KnowledgeItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
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
    
    try {
      await knowledgeApi.deleteItem(itemToDelete.id);
      setItems(prev => {
        const removeItem = (items: KnowledgeItem[]): KnowledgeItem[] => {
          return items.filter(item => {
            if (item.id === itemToDelete.id) {
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
      
      // Если удаляемый элемент был выбран, сбрасываем выбор
      if (selectedItem && selectedItem.id === itemToDelete.id) {
        setSelectedItem(null);
      }
      
      setShowDeleteDialog(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      showError('Ошибка при удалении элемента');
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
    if (!content) return [];
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Error parsing reels JSON:', error);
      return [];
    }
  };

  const parseContentPlan = (content: string | undefined): any => {
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Error parsing content plan JSON:', error);
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
        console.error('Error loading file content:', error);
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
            <ReelsList reels={parseReels(selectedItem.content)} />
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.item.itemType === 'folder' && (
              <>
                <button
                  onClick={() => {
                    setNewArticleParentId(contextMenu.item.id);
                    setShowNewArticleDialog(true);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-900 dark:text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Новый файл
                </button>
                <button
                  onClick={() => {
                    addNewFolder(contextMenu.item.id);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-900 dark:text-white"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Новая папка
                </button>
              </>
            )}
            <button
              onClick={() => handleEdit(contextMenu.item)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-900 dark:text-white"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Переименовать
            </button>
            <button
              onClick={() => handleMove(contextMenu.item)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-900 dark:text-white"
            >
              <Move className="w-4 h-4 mr-2" />
              Переместить
            </button>
            <button
              onClick={() => handleDelete(contextMenu.item)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {showDeleteDialog && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            ref={deleteDialogRef}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4"
          >
            <div className="flex items-center mb-4 text-red-500">
              <Trash2 className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-semibold">Подтверждение удаления</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Вы уверены, что хотите удалить "{itemToDelete.name}"?
              {itemToDelete.itemType === 'folder' && (
                <span className="block mt-2 text-red-500 text-sm">
                  Внимание: все файлы внутри папки также будут удалены!
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700  rounded"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
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
