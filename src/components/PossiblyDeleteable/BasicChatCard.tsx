import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, Edit, Trash2, Send, Loader, X, Paperclip } from 'lucide-react';
import { ChatCardState } from '@/utils/types/chat.types';

interface ChatCardProps {
  content: string;
  status: ChatCardState;
  attachments?: File[];
  onEdit: (content: string) => void;
  onDelete: () => void;
  onMove?: (direction: 'up' | 'down') => void;
  onSend: () => void;
  className?: string;
}

const ChatCard: React.FC<ChatCardProps> = ({
  content,
  status,
  attachments = [],
  onEdit,
  onDelete,
  onMove,
  onSend,
  className = ''
}) => {
  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing]);

  useEffect(() => {
    setEditContent(content);
  }, [content]);

  // Event handlers
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setError(null);
  }, []);

  const handleSubmitEdit = useCallback(async () => {
    if (editContent.trim() === '') {
      setError('Content cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      await onEdit(editContent);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  }, [editContent, onEdit]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(content);
      setError(null);
    }
  }, [content, handleSubmitEdit]);

  const handleSend = useCallback(async () => {
    try {
      setIsLoading(true);
      await onSend();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [onSend]);

  // Status indicator color mapping
  const statusColors = {
    [ChatCardState.READY]: 'bg-blue-500',
    [ChatCardState.EDITING]: 'bg-yellow-500',
    [ChatCardState.SENT]: 'bg-gray-500',
    [ChatCardState.COMPLETE]: 'bg-green-500',
    [ChatCardState.ERROR]: 'bg-red-500'
  };

  return (
    <div
      ref={cardRef}
      className={`relative border rounded-lg p-4 ${
        isHovered ? 'border-blue-400' : 'border-gray-200'
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      aria-label="Chat message"
    >
      {/* Status indicator */}
      <div
        className={`absolute top-2 right-2 w-3 h-3 rounded-full ${statusColors[status]}`}
        aria-label={`Status: ${status}`}
      />

      {/* Move controls (for sequential chat) */}
      {onMove && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full mr-2 flex flex-col space-y-1">
          <button
            onClick={() => onMove('up')}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Move up"
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={() => onMove('down')}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Move down"
          >
            <ArrowDown size={16} />
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="space-y-4">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full min-h-[100px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your message..."
              disabled={isLoading}
            />
            {error && (
              <p className="text-red-500 text-sm" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(content);
                  setError(null);
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEdit}
                className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-md flex items-center"
                disabled={isLoading}
              >
                {isLoading ? <Loader className="animate-spin mr-1" size={14} /> : null}
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Attachments:</h4>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gray-50 px-2 py-1 rounded-md text-sm"
                >
                  <Paperclip size={14} className="mr-1" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="absolute right-2 top-2 flex items-center space-x-2">
        {status !== ChatCardState.SENT && status !== ChatCardState.COMPLETE && (
          <>
            <button
              onClick={handleEdit}
              className="p-1 text-gray-500 hover:text-blue-500 rounded"
              disabled={isLoading}
              aria-label="Edit message"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-gray-500 hover:text-red-500 rounded"
              disabled={isLoading}
              aria-label="Delete message"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={handleSend}
              className="p-1 text-gray-500 hover:text-green-500 rounded"
              disabled={isLoading}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </>
        )}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg">
          <Loader className="animate-spin text-blue-500" size={24} />
        </div>
      )}
    </div>
  );
};

export default ChatCard;