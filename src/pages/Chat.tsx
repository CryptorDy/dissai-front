import React, { useState } from 'react';
import { useGeneration } from '../context/GenerationContext';
import { ChatInput } from '../components/chat/ChatInput';
import { ChatHistory } from '../components/chat/ChatHistory';
import { ChatParticipants } from '../components/chat/ChatParticipants';
import { ChatMessage, ChatParticipant } from '../types/chat';

export default function Chat() {
  const { tasks } = useGeneration();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const [participants] = useState<ChatParticipant[]>([
    {
      id: 'user123',
      name: 'Вы',
      role: 'Пользователь',
      isOnline: true
    },
    {
      id: 'assistant',
      name: 'Ассистент',
      role: 'AI',
      isOnline: true
    }
  ]);

  const currentUserId = "user123";

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4">
        <ChatParticipants participants={participants} />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <ChatHistory 
            messages={messages} 
            currentUserId={currentUserId}
            onDeleteMessage={handleDeleteMessage}
          />
        </div>
        <div className="p-4 border-t dark:border-gray-700">
          {showLimitMessage && (
            <div className="text-red-500 text-sm mb-2">
              Достигнут лимит задач в процессе. Дождитесь завершения текущих задач.
            </div>
          )}
          <ChatInput disabled={showLimitMessage} />
        </div>
      </div>
    </div>
  );
}
