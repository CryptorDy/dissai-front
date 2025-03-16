import React from 'react';
import { motion } from 'framer-motion';
import { NavigationMenu } from './NavigationMenu';
import { useGeneration } from '../context/GenerationContext';

interface LoadingAnimationProps {
  withNavigation?: boolean;
}

export function LoadingAnimation({ withNavigation = false }: LoadingAnimationProps) {
  const { tasks } = useGeneration();
  const pendingTasks = tasks.filter(task => task.status === 'pending');

  const content = (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-24 h-24">
        {/* Перо */}
        <motion.div
          className="absolute w-full h-full border-4 border-blue-500 rounded-full"
          initial={{ scale: 0, rotate: 0 }}
          animate={{
            scale: [0, 1, 1],
            rotate: [0, 0, 180],
            borderRadius: ["20%", "20%", "50%"],
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            times: [0, 0.2, 1],
            repeat: Infinity,
          }}
        />
        
        {/* Внутренний круг */}
        <motion.div
          className="absolute w-full h-full border-4 border-blue-300"
          initial={{ scale: 0, rotate: 0 }}
          animate={{
            scale: [0, 0.5, 0.5],
            rotate: [0, 0, -180],
            borderRadius: ["20%", "20%", "50%"],
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            times: [0, 0.2, 1],
            repeat: Infinity,
          }}
        />

        {/* Частицы */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full"
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1, 0],
              x: [0, Math.cos(i * 60 * Math.PI / 180) * 40],
              y: [0, Math.sin(i * 60 * Math.PI / 180) * 40],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              delay: i * 0.2,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="mt-6 text-gray-600 dark:text-gray-300 text-lg font-medium"
      >
        {pendingTasks.length > 0 ? pendingTasks[0].title : 'Генерация...'}
      </motion.p>
    </div>
  );

  if (withNavigation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <NavigationMenu />
        <div className="flex items-center justify-center h-[calc(100vh-96px)]">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
