import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'error' | 'success';
  message: string;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export const Toast = forwardRef<HTMLDivElement, ToastProps>(({ toast, onClose }, ref) => {
  const { id, type, message } = toast;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`flex items-center p-4 rounded-lg ${
        type === 'error'
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
      }`}
    >
      {type === 'error' ? (
        <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
      ) : (
        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
      )}
      <span className={`mx-3 text-sm ${
        type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
      }`}>
        {message}
      </span>
      <button
        onClick={() => onClose(id)}
        className={`p-1 rounded-full hover:bg-black/10 ${
          type === 'error' ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
});

Toast.displayName = 'Toast';
