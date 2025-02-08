import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Copy,
  Download,
  Edit2,
  Save,
  Trash2,
  Check,
  X,
  Loader,
  FileType,
  Image as ImageIcon
} from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ResponseCardProps {
  content: string;
  format: 'text' | 'code' | 'image';
  language?: string;
  onEdit: (content: string) => void;
  onSave: () => void;
  onDelete: () => void;
  className?: string;
}

const ResponseCard: React.FC<ResponseCardProps> = ({
  content,
  format,
  language,
  onEdit,
  onSave,
  onDelete,
  className = ''
}) => {
  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileFormat, setFileFormat] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

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

  // Set default file format based on content type
  useEffect(() => {
    switch (format) {
      case 'text':
        setFileFormat('txt');
        break;
      case 'code':
        setFileFormat(language?.toLowerCase() || 'txt');
        break;
      case 'image':
        setFileFormat('png');
        break;
    }
  }, [format, language]);

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

  const handleSave = useCallback(async () => {
    if (!fileName) {
      setError('File name is required');
      return;
    }

    try {
      setIsLoading(true);
      await onSave();
      setShowSaveDialog(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setIsLoading(false);
    }
  }, [fileName, onSave]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  }, [content]);

  // Format-specific render methods
  const renderTextContent = () => (
    <div className="prose max-w-none">
      <p className="whitespace-pre-wrap">{content}</p>
    </div>
  );

  const renderCodeContent = () => (
    <div className="relative">
      <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
        <code className={language ? `language-${language}` : ''}>
          {content}
        </code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded"
        aria-label="Copy code"
      >
        {isCopied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );

  const renderImageContent = () => (
    <div className="relative">
      <img
        src={content}
        alt="Response content"
        className="max-w-full rounded-md"
      />
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1 bg-white hover:bg-gray-100 rounded shadow"
        aria-label="Download image"
      >
        <Download size={16} />
      </button>
    </div>
  );

  return (
    <div
      ref={cardRef}
      className={`relative border rounded-lg p-4 ${className}`}
      role="article"
      aria-label={`${format} response`}
    >
      {/* Content area */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[100px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Enter ${format} content...`}
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
        <>
          {format === 'text' && renderTextContent()}
          {format === 'code' && renderCodeContent()}
          {format === 'image' && renderImageContent()}
        </>
      )}

      {/* Toolbar */}
      <div className="absolute right-2 top-2 flex items-center space-x-2">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-gray-500 hover:text-blue-500 rounded"
          aria-label="Edit content"
        >
          <Edit2 size={16} />
        </button>

        <Popover open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <PopoverTrigger asChild>
            <button
              className="p-1 text-gray-500 hover:text-green-500 rounded"
              aria-label="Save to file"
            >
              <Save size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">File Name</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter file name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Format</label>
                <select
                  value={fileFormat}
                  onChange={(e) => setFileFormat(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {format === 'text' && (
                    <>
                      <option value="txt">Plain Text (.txt)</option>
                      <option value="md">Markdown (.md)</option>
                    </>
                  )}
                  {format === 'code' && (
                    <>
                      <option value={language?.toLowerCase() || 'txt'}>
                        {language || 'Plain Text'} (.{language?.toLowerCase() || 'txt'})
                      </option>
                      <option value="txt">Plain Text (.txt)</option>
                    </>
                  )}
                  {format === 'image' && (
                    <>
                      <option value="png">PNG Image (.png)</option>
                      <option value="jpg">JPEG Image (.jpg)</option>
                    </>
                  )}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-md flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader className="animate-spin mr-1" size={14} /> : null}
                  Save
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <button
          onClick={onDelete}
          className="p-1 text-gray-500 hover:text-red-500 rounded"
          aria-label="Delete response"
        >
          <Trash2 size={16} />
        </button>
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

export default ResponseCard;