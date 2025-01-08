// src/pages/chat/ChatPage.tsx
import React, { useState, useEffect } from 'react';
import Header from "@/components/Banner/MainBanner/MainHeader";
import ChatBanner from '@/components/Banner/ChatBanner/ChatBanner';
import BaseChat from '@/components/Chat/BasicChat/BaseChatMainPage';
import SequentialChat from '@/components/Chat/Sequential/SequentialChatMainPage';
import { useApiService } from '@/hooks/useAPIRequest';
import { ApiProvider } from '@/services/api/interfaces/api.types';
import {
  ChatType,
  ChatSettings,
  ChatRequest,
  Role,
  ChatResponse,
  ChatDocument
} from '@/utils/types/chat.types';

const DEFAULT_SETTINGS: ChatSettings = {
  temperature: 0.7,
  chatType: ChatType.BASE,
  savingParams: {
    saveToApplication: true,
    saveToFile: false,
  }
};

const ChatPage: React.FC = () => {
  // Common state
  const [title, setTitle] = useState("New Chat");
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [systemContext, setSystemContext] = useState<string>('');
  const [selectedAPI] = useState(ApiProvider.OPENAI);
  const { processRequests, isProcessing, setIsProcessing } = useApiService(systemContext);

  // Initialize requests if empty
  useEffect(() => {
    if (requests.length === 0) {
      setRequests([{
        id: '1',
        role: Role.USER,
        type: ChatType.BASE,
        step: 'chat',
        content: '',
        status: 'pending',
        number: 1
      }]);
    }
  }, []);

  // Handle settings changes
  const handleSettingsChange = (newSettings: ChatSettings) => {
    setSettings(newSettings);
    
    // Reset requests when changing chat type if needed
    if (newSettings.chatType !== settings.chatType) {
      setRequests([{
        id: '1',
        role: Role.USER,
        type: newSettings.chatType,
        step: 'chat',
        content: '',
        status: 'pending',
        number: 1
      }]);
    }
  };

  // Common handlers
  const handleProcessRequests = async () => {
    try {
      setIsProcessing(true);
      await processRequests(requests, selectedAPI);
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save chat document
  const handleSave = async (chatDoc: ChatDocument) => {
    // Implement save functionality
    console.log('Saving chat:', chatDoc);
  };

  // Render appropriate chat component based on type
  const renderChatComponent = () => {
    const commonProps = {
      requests,
      setRequests,
      systemContext,
      setSystemContext,
      onProcessRequests: handleProcessRequests,
      isProcessing,
      onSave: handleSave
    };

    switch (settings.chatType) {
      case ChatType.SEQUENTIAL:
        return <SequentialChat {...commonProps} />;
      case ChatType.BASE:
      default:
        return <BaseChat {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ChatBanner
        chatType={settings.chatType}
        title={title}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onTitleChange={setTitle}
      />
      <main className="flex-1 flex overflow-hidden">
        {renderChatComponent()}
      </main>
    </div>
  );
};

export default ChatPage;