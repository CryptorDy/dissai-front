import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Trash2 } from 'lucide-react';
import { ChatMessage } from '../../types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  currentUserId: string;
  onDeleteMessage?: (messageId: string) => void;
}

export function ChatMessages({ messages, currentUserId, onDeleteMessage }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
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
                <div 
                  className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%] group relative`}
                >
                  {position === 'first' && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 mx-2">
                      {message.sender.name} • {message.sender.role}
                    </span>
                  )}
                  <div
                    className={`relative rounded-lg px-4 py-2 max-w-full break-words prose prose-sm dark:prose-invert group ${
                      isCurrentUser
                        ? 'bg-blue-600 text-white prose-headings:text-white prose-a:text-white prose-strong:text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                    <button
                      onClick={() => onDeleteMessage?.(message.id)}
                      className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10"
                    >
                      <Trash2 className={`w-4 h-4 ${
                        isCurrentUser ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
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
  );
}
