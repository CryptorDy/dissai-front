import React, { useState } from 'react';
import { NavigationMenu } from '../components/NavigationMenu';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { useGeneration } from '../context/GenerationContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { roadmapApi } from '../services/api';

const Roadmap = () => {
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [detailLevel, setDetailLevel] = useState(3);
  const { startGeneration } = useGeneration();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await roadmapApi.generate({ goal, deadline, detailLevel });
      if (response.data.taskId) {
        startGeneration(response.data.taskId);
        navigate('/roadmap-result');
      }
    } catch (error) {
      showToast('Error generating roadmap', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <NavigationMenu />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Create Your Roadmap</h1>
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Your Goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              rows={4}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Detail Level (1-5)
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={detailLevel}
              onChange={(e) => setDetailLevel(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Basic</span>
              <span>Detailed</span>
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Generate Roadmap
          </button>
        </form>
      </div>
    </div>
  );
};

export default Roadmap;
