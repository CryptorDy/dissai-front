import React from 'react';
import { motion } from 'framer-motion';
import { ChatParticipant } from '../../types/chat';

interface ChatParticipantsProps {
  participants?: ChatParticipant[];
}

export function ChatParticipants({ participants = [] }: ChatParticipantsProps) {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Участники</h2>
      </div>
      <div className="overflow-y-auto h-[calc(100vh-10rem)]">
        {participants.map((participant) => (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="relative flex-shrink-0 w-3 h-3">
                <div className={`absolute inset-0 rounded-full ${
                  participant.isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {participant.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {participant.role}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
