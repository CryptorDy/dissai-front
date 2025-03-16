import React from 'react';
import { RichTextEditor } from './RichTextEditor';

interface MarkdownEditorProps {
  content: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (targetFolderId?: string | null) => void;
  onChange: (value: string) => void;
  title?: string;
  height?: number;
  itemId?: string;
}

export function MarkdownEditor({
  content,
  isEditing,
  onEdit,
  onSave,
  onChange,
  title = 'Редактор',
  height = 500,
  itemId
}: MarkdownEditorProps) {
  return (
    <RichTextEditor
      content={content}
      isEditing={isEditing}
      onEdit={onEdit}
      onSave={onSave}
      onChange={onChange}
      title={title}
      itemId={itemId}
      format="html" // Всегда используем HTML формат
    />
  );
}
