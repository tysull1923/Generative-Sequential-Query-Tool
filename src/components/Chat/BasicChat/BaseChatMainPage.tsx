// src/pages/chat/components/BaseChat.tsx
import React, { useState, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ChatCard from '@/components/Chat/BasicChatCard';
import ResponseCard from '@/components/Chat/ResponseCard';
import SystemContextCard from '@/components/features/SystemsContext/SystemContextCard';
import {
  ChatCardState,
  ChatRequest,
  ChatDocument,
  Role,
  FileAttachment,
  ChatType
} from '@/utils/types/chat.types';
import ResponsePanel from '@/components/features/ResponsePanel';


interface BaseChatProps {
  requests: ChatRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChatRequest[]>>;
  systemContext: string;
  setSystemContext: React.Dispatch<React.SetStateAction<string>>;
  onProcessRequests: () => Promise<void>;
  isProcessing: boolean;
  onSave: (chat: ChatDocument) => void;
}

const BaseChat: React.FC<BaseChatProps> = ({
  requests,
  setRequests,
  systemContext,
  setSystemContext,
  onProcessRequests,
  isProcessing,
  onSave
}) => {
  // State
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showSystemContext, setShowSystemContext] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Handlers
  const handleSendMessage = async () => {
    if (!pendingMessage.trim() && attachments.length === 0) return;

    try {
      const newRequest: ChatRequest = {
        id: Date.now().toString(),
        role: Role.USER,
        type: ChatType.BASE,
        step: 'chat',
        content: pendingMessage,
        status: 'pending',
        number: requests.length + 1
      };

      setRequests(prev => [...prev, newRequest]);
      setPendingMessage('');
      setAttachments([]);
      
      await onProcessRequests();
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  };

  const handleFileAttachment = (files: FileList | null) => {
    if (!files) return;

    const newAttachments: FileAttachment[] = Array.from(files).map(file => ({
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      content: file
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
        {/* System Context */}
        {/* {showSystemContext && (
          <SystemContextCard
            content={systemContext}
            onContentChange={setSystemContext}
            onDelete={() => {
              setShowSystemContext(false);
              setSystemContext('');
            }}
          />
        )} */}

        {/* Chat Messages */}
        {requests.map((request) => (
          <div key={request.id} className="space-y-4">
            <ChatCard
              content={request.content || ''}
              status={request.status === 'pending' ? ChatCardState.READY : ChatCardState.SENT}
              onDelete={() => {
                setRequests(prev => prev.filter(r => r.id !== request.id));
              }}
              onEdit={(newContent) => {
                setRequests(prev =>
                  prev.map(r =>
                    r.id === request.id ? { ...r, content: newContent } : r
                  )
                );
              }}
            />
            {request.response && (
              <ResponsePanel
                response={request.response}
                isEditable={true}
                onSave={() => {/* Implement save functionality */}}
              />
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="relative">
          <textarea
            value={pendingMessage}
            onChange={e => setPendingMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full p-3 pr-24 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isProcessing}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="absolute right-2 bottom-2 flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={e => handleFileAttachment(e.target.files)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-blue-500 rounded-md"
              disabled={isProcessing}
            >
              Attach
            </button>
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              disabled={isProcessing || (!pendingMessage.trim() && attachments.length === 0)}
            >
              Send
            </button>
          </div>
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map(file => (
              <div
                key={file.id}
                className="flex items-center bg-gray-50 px-2 py-1 rounded-md text-sm"
              >
                <span className="truncate max-w-[200px]">{file.name}</span>
                <button
                  onClick={() => setAttachments(prev => prev.filter(f => f.id !== file.id))}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseChat;