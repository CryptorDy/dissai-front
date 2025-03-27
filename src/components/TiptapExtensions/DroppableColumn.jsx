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
      <div className="kanban-column-header flex items-center justify-between mb-3">
        <input
          type="text"
          value={column.title}
          onChange={(e) => handleColumnTitleChange(column.id, e.target.value)}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent border-none p-0 focus:ring-0 w-full"
          onMouseDown={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        />
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

      {/* Кнопка добавления только в первой колонке (Планируется) */}
      {isFirstColumn && (
        <button
          className="mt-4 text-sm text-white bg-blue-500 hover:bg-blue-600 py-1 px-3 rounded-md w-full transition-colors"
          onClick={() => handleAddCard(column.id)}
          onMouseDown={e => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          + Добавить задачу
        </button>
      )}
    </div>
  );
};

export default DroppableColumn; 