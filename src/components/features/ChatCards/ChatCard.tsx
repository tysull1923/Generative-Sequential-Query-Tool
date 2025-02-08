import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MoveUp, MoveDown, Trash2, Send, Paperclip } from 'lucide-react';
import { ChatCardState, ChatType, FileAttachment } from '@/utils/types/chat.types';

interface ChatCardProps {
  id: string;
  number: number;
  content: string;
  status: string;
  response?: string;
  chatType: ChatType;
  isFirst: boolean;
  isLast: boolean;
  attachments?: FileAttachment[];
  isEditable?: boolean;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onDelete: (id: string) => void;
  onContentChange: (id: string, content: string) => void;
  onResponseClick?: (id: string) => void;
  onSend?: (id: string) => void;
  onAttach?: (id: string, files: FileList) => void;
  onRemoveAttachment?: (id: string, attachmentId: string) => void;
  onClick?: () => void;
}

const ChatCard: React.FC<ChatCardProps> = ({
  id,
  number,
  content,
  status,
  response,
  chatType,
  isFirst,
  isLast,
  attachments = [],
  onMove,
  onDelete,
  onContentChange,
  onResponseClick,
  onSend,
  onAttach,
  onRemoveAttachment,
  onClick
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onAttach) {
      onAttach(id, e.target.files);
    }
  };

  const ControlButtons = () => (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onMove(id, 'up');
        }}
        disabled={isFirst}
        className={chatType === ChatType.BASE ? "h-6 w-6" : "h-8 w-8"}
      >
        <MoveUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onMove(id, 'down');
        }}
        disabled={isLast}
        className={chatType === ChatType.BASE ? "h-6 w-6" : "h-8 w-8"}
      >
        <MoveDown className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
        className={chatType === ChatType.BASE ? "h-6 w-6" : "h-8 w-8"}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </>
  );

  return (
    <Card 
      className={`my-4 ${status === 'completed' ? 'hover:bg-gray-50 transition-colors' : ''}`}
      onClick={onClick}
    >
      {/* Only show title for Sequential Chat */}
      {chatType === ChatType.SEQUENTIAL && (
        <div className="px-4 pt-4 pb-0 flex justify-between items-center">
          <span className="font-semibold">Request #{number}</span>
          <div className="flex gap-2">
            <ControlButtons />
          </div>
        </div>
      )}
      
      <CardContent className="p-4">
        <Textarea
          placeholder="Type your request here..."
          value={content}
          onChange={(e) => status !== 'completed' && onContentChange(id, e.target.value)}
          disabled={status === 'completed'}
          className={`min-h-[100px] ${
            status === 'completed' ? 'cursor-pointer bg-gray-50' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            status === 'completed' && onResponseClick?.(id);
          }}
        />
        
        {/* Attachments Display */}
        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map(file => (
              <div
                key={file.id}
                className="flex items-center bg-gray-50 px-2 py-1 rounded-md text-sm"
              >
                <span className="truncate max-w-[200px]">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveAttachment?.(id, file.id);
                  }}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              status === 'completed' ? 'bg-green-100 text-green-800' :
              status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
              status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status}
            </span>
            
            {/* Control buttons next to status for basic chat */}
            {chatType === ChatType.BASE && <ControlButtons />}
            {chatType === ChatType.REQUIREMENTS && <ControlButtons/>}
            
            {status === 'completed' && (
              <span className="text-sm text-gray-500">
                Click to view response
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={status === 'completed'}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onSend?.(id);
              }}
              disabled={status === 'completed' || !content.trim()}
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatCard;