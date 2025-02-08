//TO BE DELETED


import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ChatBanner from '@/components/Banner/ChatBanner/ChatBanner';
import ChatCard from '@/components/PossiblyDeleteable/BasicChatCard';
import ResponseCard from '@/components/features/Responses/ResponseCard';
import {
  ChatType,
  ChatSettings,
  ChatCardState,
  BaseMessage,
  FileMessage,
  ChatResponse,
  FileAttachment,
  ChatSavingParams
} from '@/utils/types/chat.types';
import { useApiService } from '@/hooks/useAPIRequest';
import { useChatStore } from '@/stores/chatStore';
import Header from '@/components/Banner/MainBanner/MainHeader';
import { ApiProvider } from '@/services/api/interfaces/api.types';
import { Role, ChatRequest } from '@/lib/api/openai.api-requests.types';

interface BaseChatProps {
  chatId?: string;
  initialSettings?: ChatSettings;
  onSave?: (chat: Chat) => void;
  className?: string;
}

interface Chat {
  id: string;
  title: string;
  settings: ChatSettings;
  messages: (BaseMessage | FileMessage)[];
  responses: ChatResponse[];
}

const DEFAULT_SETTINGS: ChatSettings = {
  temperature: 0.7,
  chatType: ChatType.BASE,
  savingParams: {
    saveToApplication: true,
    saveToFile: false,
  }
};

const BaseChat: React.FC<BaseChatProps> = ({
  chatId,
  initialSettings = DEFAULT_SETTINGS,
  onSave,
  className = ''
}) => {
  // State management
  const [settings, setSettings] = useState<ChatSettings>(initialSettings);
  const [messages, setMessages] = useState<ChatRequest>([]);
  const [responses, setResponses] = useState<ChatResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('New Chat');
  const [pendingMessage, setPendingMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [systemContext, setSystemContext] = useState<string>('');
  const { processRequests, isProcessing, setIsProcessing, conversationHistory } = useApiService(systemContext);
  const [selectedAPI] = useState(ApiProvider.OPENAI);
  const [requests, setRequests] = useState<ChatRequest[]>([
      {
        id: '1',
        role: Role.USER,
        type: 'chat',
        number: 1,
        content: '',
        status: 'pending'
      }
    ]);
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const api = useApiService(systemContext);
  const chatStore = useChatStore();

  // Effects
  useEffect(() => {
    if (chatId) {
      loadChat(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, responses]);

  // Chat loading
  const loadChat = async (id: string) => {
    try {
      setIsLoading(true);
      const chat = await chatStore.getChat(id);
      setTitle(chat.title);
      setSettings(chat.settings);
      setMessages(chat.messages);
      setResponses(chat.responses);
    } catch (err) {
      setError('Failed to load chat');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  const handlePlay = async () => {
		try {
			console.log('Starting request process');
			setIsProcessing(true);
			await processRequests(requests, selectedAPI);
		} catch (error) {
			console.error('Request failed:', error);
			setIsProcessing(false);
		}
	};

  // Message handling
  const handleSendMessage = async () => {
    if (!pendingMessage.trim() && attachments.length === 0) return;

    try {
      setIsLoading(true);
      setError(null);

      // Create message object
      const newMessage: BaseMessage | FileMessage = attachments.length > 0
        ? {
            id: Date.now().toString(),
            content: pendingMessage,
            timestamp: Date.now(),
            sender: 'user',
            attachments
          }
        : {
            id: Date.now().toString(),
            content: pendingMessage,
            timestamp: Date.now(),
            sender: 'user'
          };
          
      // Add message to chat
      setMessages(prev => [...prev, newMessage]);

      //Send to API
      // const response = await api.sendMessage({
      //   message: pendingMessage,
      //   attachments,
      //   settings
      // });

      //Add response
      setResponses(prev => [...prev, response]);

      // Clear input
      setPendingMessage('');
      setAttachments([]);

      // Save chat if needed
      if (settings.savingParams?.saveToApplication) {
        await saveChat();
      }
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // File handling
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

  // Settings management
  const handleSettingsChange = useCallback((newSettings: Partial<ChatSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  // Chat saving
  const saveChat = async () => {
    try {
      const chat: Chat = {
        id: chatId || Date.now().toString(),
        title,
        settings,
        requests,
        responses
      };

      // if (settings.savingParams?.saveToFile) {
      //   await chatStore.exportChat(chat);
      // }

      // if (settings.savingParams?.saveToApplication) {
      //   await chatStore.saveChat(chat);
      // }

      onSave?.(chat);
    } catch (err) {
      setError('Failed to save chat');
      console.error(err);
    }
  };

  return (
    
    <div className={`flex flex-col h-full ${className}`}>
      <Header />
      {/* Chat Banner */}
      <ChatBanner
        chatType={ChatType.BASE}
        title={title}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onTitleChange={setTitle}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mx-4 mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Chat History */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {/* {messages.map((message, index) => (
          <div key={message.id} className="max-w-2/3 mx-auto">
            <ChatCard
              content={message.content}
              status={ChatCardState.SENT}
              attachments={'attachments' in message ? message.attachments : undefined}
              onEdit={() => {}}
              onDelete={() => {}}
              onSend={() => {}}
            />
            {responses[index] && (
              <ResponseCard
                content={responses[index].content}
                format={responses[index].type}
                onEdit={() => {}}
                onSave={() => {}}
                onDelete={() => {}}
              />
            )}
          </div>
        ))} */}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="max-w-2/3 mx-auto">
          <div className="relative">
            <textarea
              value={pendingMessage}
              onChange={e => setPendingMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-3 pr-24 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={isLoading}
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
                disabled={isLoading}
              >
                Attach
              </button>
              <button
                onClick={handlePlay}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                disabled={isLoading || (!pendingMessage.trim() && attachments.length === 0)}
              >
                Send
              </button>
            </div>
          </div>

          {/* Attachment Preview */}
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
    </div>
  );
};

export default BaseChat;