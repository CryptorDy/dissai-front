import React from 'react';
import DraggableCard from './DraggableCard';

// Компонент колонки с поддержкой drop
const DroppableColumn = ({ 
  column, 
  cards, 
  handleColumnTitleChange, 
  handleAddCard, 
  handleDeleteCard, 
  handleCardTitleChange, 
  handleCardDescriptionChange, 
  handleCardPriorityChange, 
  handleDeadlineChange,
  handleDragStart, 
  handleDrop, 
  isFirstColumn 
}) => {
  return (
    <div
      className="kanban-column bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDrop(column.id, e);
      }}
    >
      <div className="kanban-column-header flex items-center mb-3">
        <input
          type="text"
          value={column.title}
          onChange={(e) => handleColumnTitleChange(column.id, e.target.value)}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent border-none p-0 focus:ring-0 mr-auto"
          onMouseDown={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        />
        <button
          className="text-blue-500 hover:text-blue-600 transition-colors mx-2"
          onClick={() => handleAddCard(column.id)}
          onMouseDown={e => {
            e.stopPropagation();
            e.preventDefault();
          }}
          title="Добавить задачу"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {cards.length}
        </span>
      </div>

      <div className="min-h-[100px] kanban-cards-container pt-2">
        {cards.map((card, index) => (
          <DraggableCard
            key={card.id}
            card={card}
            columnId={column.id}
            handleDeleteCard={handleDeleteCard}
            handleCardTitleChange={handleCardTitleChange}
            handleCardDescriptionChange={handleCardDescriptionChange}
            handleCardPriorityChange={handleCardPriorityChange}
            handleDeadlineChange={handleDeadlineChange}
            handleDragStart={handleDragStart}
            isLastCard={index === cards.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default DroppableColumn; 