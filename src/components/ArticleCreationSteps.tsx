import React from 'react';
import { motion } from 'framer-motion';

interface Step {
  question: string;
  placeholder: string;
}

interface ArticleCreationStepsProps {
  currentStep: number;
  steps: Step[];
  answers: string[];
  onAnswerChange: (answer: string) => void;
  onNextStep: () => void;
  isLastStep: boolean;
}

export function ArticleCreationSteps({
  currentStep,
  steps,
  answers,
  onAnswerChange,
  onNextStep,
  isLastStep
}: ArticleCreationStepsProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {steps[currentStep].question}
        </h3>
        <div>
          <textarea
            value={answers[currentStep] || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={steps[currentStep].placeholder}
            className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            rows={4}
          />
        </div>
        <button
          onClick={onNextStep}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isLastStep ? 'Показать план' : 'Далее'}
        </button>
      </motion.div>
    </div>
  );
}
