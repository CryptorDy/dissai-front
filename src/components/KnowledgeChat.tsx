import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trash2, MoreVertical } from 'lucide-react';
import { ChatMessage, ChatParticipant } from '../types/chat';
import { ChatMessages } from './chat/ChatMessages';

interface KnowledgeChatProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  itemId: string;
}

export function KnowledgeChat({ isOpen, onClose, content, title, itemId }: KnowledgeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const currentUser: ChatParticipant = {
    id: 'user',
    name: 'Вы',
    role: 'Пользователь',
    isOnline: true
  };

  const assistant: ChatParticipant = {
    id: 'assistant',
    name: 'AI Ассистент',
    role: 'Эксперт',
    isOnline: true
  };

  useEffect(() => {
    if (isOpen) {
      const storageKey = `chat_history_${itemId}`;
      const savedMessages = localStorage.getItem(storageKey);
      
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        } catch (error) {
          console.error('Error parsing saved messages:', error);
          initializeChat();
        }
      } else {
        initializeChat();
      }
    }
  }, [isOpen, itemId, title]);

  useEffect(() => {
    if (messages.length > 0) {
      const storageKey = `chat_history_${itemId}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, itemId]);

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

  const initializeChat = () => {
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      content: `👋 Здравствуйте! Я готов помочь вам разобраться с темой "${title}". Вы можете задать мне любые вопросы по содержанию, и я постараюсь на них ответить.`,
      sender: assistant,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: currentUser,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Имитация ответа ассистента
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(inputValue.trim(), content),
        sender: assistant,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateResponse = (question: string, context: string): string => {
    return `Я проанализировал содержание и могу сказать следующее:\n\n1. Ваш вопрос касается важного аспекта темы\n2. В материале есть несколько ключевых моментов, которые могут помочь\n3. Давайте разберем это подробнее\n\n*Примечание: это демонстрационный ответ. В реальной версии здесь будет содержательный ответ на основе контекста.*`;
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    setContextMenu(null);
  };

  const handleClearChat = () => {
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      content: `Чат очищен. Начнем сначала!\n\nЯ готов помочь вам разобраться с темой "${title}". Вы можете задать мне любые вопросы по содержанию.`,
      sender: assistant,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
    setContextMenu(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-gray-800 shadow-lg rounded-lg mb-6 overflow-hidden"
          ref={chatContainerRef}
        >
          {/* Заголовок */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Чат по теме: {title}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleClearChat}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                title="Очистить чат"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Сообщения */}
          <div className="h-[600px] overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="max-w-3xl mx-auto">
              <ChatMessages
                messages={messages}
                currentUserId={currentUser.id}
                onDeleteMessage={handleDeleteMessage}
              />
              {isTyping && (
                <div className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ввод сообщения */}
          <form 
            onSubmit={handleSendMessage}
            className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end space-x-2">
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Введите сообщение..."
                    className="w-full p-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none"
                    rows={1}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>

          {/* Контекстное меню */}
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
                <button
                  onClick={() => handleDeleteMessage(contextMenu.messageId)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-red-500"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить сообщение
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
