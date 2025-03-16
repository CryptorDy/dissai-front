import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast } from '../components/Toast';
import type { Toast as ToastType } from '../components/Toast';

interface ToastContextType {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((type: 'error' | 'success', message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    // Автоматически удаляем уведомление через 5 секунд
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const showError = useCallback((message: string) => {
    addToast('error', message);
  }, [addToast]);

  const showSuccess = useCallback((message: string) => {
    addToast('success', message);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showError, showSuccess }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              toast={toast}
              onClose={removeToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
