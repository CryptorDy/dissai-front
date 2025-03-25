import React from 'react';
import { RichTextEditor } from './RichTextEditor';

interface MarkdownEditorProps {
  content: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (targetFolderId?: string | null, fileName?: string) => void;
  onChange: (value: string) => void;
  title?: string;
  height?: number;
  itemId?: string;
  autoSave?: boolean;
  fileType?: string;
}

export function MarkdownEditor({
  content,
  isEditing,
  onEdit,
  onSave,
  onChange,
  title,
  height = 500,
  itemId,
  autoSave = true,
  fileType = 'article'
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
      autoSave={autoSave}
      fileType={fileType}
    />
  );
}
