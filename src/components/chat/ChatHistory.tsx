import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Trash2, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../../types/chat';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({ isOpen, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4"
      >
        <div className="flex items-center mb-4 text-red-500">
          <AlertCircle className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-semibold">Подтверждение удаления</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Вы уверены, что хотите удалить это сообщение?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Удалить
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface ChatHistoryProps {
  messages: ChatMessage[];
  currentUserId: string;
  onDeleteMessage?: (messageId: string) => void;
}

export function ChatHistory({ messages = [], currentUserId, onDeleteMessage }: ChatHistoryProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  const getMessagePosition = (index: number, senderId: string) => {
    if (index === 0) return 'first';
    const prevMessage = messages[index - 1];
    if (prevMessage.sender.id !== senderId) return 'first';
    return 'middle';
  };

  const handleDeleteClick = (messageId: string) => {
    setMessageToDelete(messageId);
  };

  const handleConfirmDelete = () => {
    if (messageToDelete && onDeleteMessage) {
      onDeleteMessage(messageToDelete);
    }
    setMessageToDelete(null);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => {
              const isCurrentUser = message.sender.id === currentUserId;
              const position = getMessagePosition(index, message.sender.id);

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%] group relative`}>
                    {position === 'first' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 mx-2">
                        {message.sender.name} • {message.sender.role}
                      </span>
                    )}
                    <div
                      className={`
                        relative rounded-lg px-4 py-2 max-w-full break-words
                        ${isCurrentUser
                          ? 'bg-gray-200 dark:bg-gray-600 ml-8 rounded-tr-none'
                          : 'bg-gray-100 dark:bg-gray-700 mr-8 rounded-tl-none'
                        }
                      `}
                    >
                      <div className="prose prose-sm max-w-none text-gray-900 dark:text-white">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      <button
                        onClick={() => handleDeleteClick(message.id)}
                        className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10"
                      >
                        <Trash2 className={`w-4 h-4 ${
                          isCurrentUser ? 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`} />
                      </button>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 mx-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={messageToDelete !== null}
        onConfirm={handleConfirmDelete}
        onCancel={() => setMessageToDelete(null)}
      />
    </>
  );
}
