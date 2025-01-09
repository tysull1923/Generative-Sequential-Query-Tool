// src/pages/chat/ChatPage.tsx
// src/pages/chat/ChatPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAPI } from '@/context/APIContext';
import { useLangChainService } from '@/services/api/langchain/langChainApiService';
import Header from "@/components/Banner/MainBanner/MainHeader";
import ChatBanner from '@/components/Banner/ChatBanner/ChatBanner';
import BaseChat from '@/components/Chat/BasicChat/BaseChatMainPage';
import SequentialChat from '@/components/Chat/Sequential/SequentialChatMainPage';
import SystemContextModal from '@/components/features/SystemsContext/SystemContextModal';
import {
  ChatType,
  ChatSettings,
  ChatRequest,
  Role,
  ExecutionStatus,
  ChatCardState
} from '@/utils/types/chat.types';

const DEFAULT_SETTINGS: ChatSettings = {
  temperature: 0.7,
  chatType: ChatType.BASE,
  savingParams: {
    saveToApplication: true,
    saveToFile: false,
    summary: ''
  }
};

const ChatPage: React.FC = () => {
  // Common state
  const [title, setTitle] = useState("New Chat");
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [systemContext, setSystemContext] = useState<string>('');
  const [isSystemContextModalOpen, setIsSystemContextModalOpen] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  // Get API context and LangChain service
  const { selectedAPI } = useAPI();
  const { 
    processRequests, 
    isProcessing, 
    setIsProcessing,
    checkOllamaConnection 
  } = useLangChainService(
    systemContext,
    { baseUrl: 'http://localhost:11434' }
  );

  // Initialize requests if empty
  useEffect(() => {
    if (requests.length === 0) {
      setRequests([{
        id: '1',
        role: Role.USER,
        type: settings.chatType,
        content: '',
        status: ChatCardState.READY,
        number: 1
      }]);
    }
  }, [settings.chatType]);

  // Process requests handler
  const handleProcessRequests = async (requestId?: string) => {
    setError(null);
    
    try {
      setIsProcessing(true);
      setExecutionStatus(ExecutionStatus.RUNNING);
      
      const requestsToProcess = requestId 
        ? [requests.find(r => r.id === requestId)!]
        : requests;

      const processedRequests = await processRequests(requestsToProcess, selectedAPI);
      
      setRequests(prev => {
        return prev.map(req => {
          const processed = processedRequests.find(p => p.id === req.id);
          return processed || req;
        });
      });
      
      setExecutionStatus(ExecutionStatus.COMPLETED);
    } catch (error) {
      console.error('Request failed:', error);
      setError(error.message || 'Failed to process request');
      setExecutionStatus(ExecutionStatus.ERROR);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSettingsChange = (newSettings: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleSave = async (chatDoc: any) => {
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
      onSave: handleSave,
      title,
      executionStatus,
      error
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
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <SystemContextModal
        isOpen={isSystemContextModalOpen}
        onClose={() => setIsSystemContextModalOpen(false)}
        content={systemContext}
        onSave={(content) => {
          setSystemContext(content);
          setIsSystemContextModalOpen(false);
        }}
        onDelete={() => {
          setSystemContext('');
          setIsSystemContextModalOpen(false);
        }}
      />
      
      <ChatBanner
        chatType={settings.chatType}
        title={title}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onTitleChange={setTitle}
        onSystemContextClick={() => setIsSystemContextModalOpen(true)}
        hasSystemContext={!!systemContext}
      />
      
      <main className="flex-1 flex overflow-hidden">
        {renderChatComponent()}
      </main>
    </div>
  );
};

export default ChatPage;







// src/pages/chat/ChatPage.tsx
// import React, { useState, useEffect, useCallback } from 'react';
// import Header from "@/components/Banner/MainBanner/MainHeader";
// import ChatBanner from '@/components/Banner/ChatBanner/ChatBanner';
// import BaseChat from '@/components/Chat/BasicChat/BaseChatMainPage';
// import SequentialChat from '@/components/Chat/Sequential/SequentialChatMainPage';
// import SystemContextModal from '@/components/features/SystemsContext/SystemContextModal';
// import { useApiService } from '@/services/api/hooks/useAPIRequest';
// import { ApiProvider } from '@/services/api/interfaces/api.types';
// import {
//   ChatType,
//   ChatSettings,
//   ChatRequest,
//   Role,
//   SequentialStepType,
//   ChatDocument,
//   ExecutionStatus,
//   ChatCardState
// } from '@/utils/types/chat.types';

// const DEFAULT_SETTINGS: ChatSettings = {
//   temperature: 0.7,
//   chatType: ChatType.BASE,
//   savingParams: {
//     saveToApplication: true,
//     saveToFile: false,
//     summary: ''
//   }
// };

// const ChatPage: React.FC = () => {
//   // Common state
//   const [title, setTitle] = useState("New Chat");
//   const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
//   const [requests, setRequests] = useState<ChatRequest[]>([]);
//   const [systemContext, setSystemContext] = useState<string>('');
//   const [isSystemContextModalOpen, setIsSystemContextModalOpen] = useState(false);
//   const [selectedAPI] = useState(ApiProvider.OPENAI);
//   const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE);
//   const { processRequests, isProcessing, setIsProcessing } = useApiService(systemContext);

//   // Initialize requests if empty
//   useEffect(() => {
//     if (requests.length === 0) {
//       setRequests([{
//         id: '1',
//         role: Role.USER,
//         type: settings.chatType,
//         step: SequentialStepType.MESSAGE,
//         content: '',
//         status: ChatCardState.READY,
//         number: 1
//       }]);
//     }
//   }, [settings.chatType]);

//   // System Context handlers
//   const handleSystemContextClick = useCallback(() => {
//     setIsSystemContextModalOpen(true);
//   }, []);

//   const handleSaveSystemContext = useCallback((content: string) => {
//     setSystemContext(content);
//     setSettings(prev => ({
//       ...prev,
//       systemContext: content
//     }));
//     setIsSystemContextModalOpen(false);
//   }, []);

//   const handleDeleteSystemContext = useCallback(() => {
//     setSystemContext('');
//     setSettings(prev => ({
//       ...prev,
//       systemContext: undefined
//     }));
//   }, []);

//   // Handle settings changes
//   const handleSettingsChange = useCallback((newSettings: Partial<ChatSettings>) => {
//     setSettings(prev => {
//       const updated = { ...prev, ...newSettings };
      
//       // Reset requests when changing chat type
//       if (newSettings.chatType && newSettings.chatType !== prev.chatType) {
//         setRequests([{
//           id: '1',
//           role: Role.USER,
//           type: newSettings.chatType,
//           step: SequentialStepType.MESSAGE,
//           content: '',
//           status: ChatCardState.READY,
//           number: 1
//         }]);
//         setExecutionStatus(ExecutionStatus.IDLE);
//       }
      
//       return updated;
//     });
//   }, []);

//   // Add step handler for sequential chat
//   const handleAddStep = useCallback((stepType: SequentialStepType.PAUSE | SequentialStepType.DELAY) => {
//     if (settings.chatType !== ChatType.SEQUENTIAL) return;

//     const newStep: ChatRequest = {
//       id: Date.now().toString(),
//       role: Role.SYSTEM,
//       type: ChatType.SEQUENTIAL,
//       step: stepType === 'pause' ? SequentialStepType.PAUSE : SequentialStepType.DELAY,
//       status: ChatCardState.READY,
//       number: requests.length + 1,
//       isPaused: stepType === 'pause',
//       ...(stepType === 'delay' && { duration: 5 }) // Default 5 seconds for delay
//     };

//     setRequests(prev => [...prev, newStep]);
//   }, [settings.chatType, requests.length]);

//   // Process requests handler
//   const handleProcessRequests = async (requestId?: string) => {
//     try {
//       setIsProcessing(true);
//       setExecutionStatus(ExecutionStatus.RUNNING);
      
//       if (requestId) {
//         // Single request processing (Base Chat)
//         await processRequests([requests.find(r => r.id === requestId)!], selectedAPI);
//       } else {
//         // Sequential processing
//         await processRequests(requests, selectedAPI);
//       }
      
//       setExecutionStatus(ExecutionStatus.COMPLETED);
//     } catch (error) {
//       console.error('Request failed:', error);
//       setExecutionStatus(ExecutionStatus.ERROR);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   // Save chat document
//   const handleSave = async (chatDoc: ChatDocument) => {
//     try {
//       // Implement save functionality
//       console.log('Saving chat:', chatDoc);
      
//       // Update chat document with current settings and context
//       const updatedDoc = {
//         ...chatDoc,
//         settings,
//         systemContext
//       };
      
//       // Here you would typically call your save service
//       // await chatService.saveChat(updatedDoc);
      
//     } catch (error) {
//       console.error('Failed to save chat:', error);
//     }
//   };

//   // Render appropriate chat component based on type
//   const renderChatComponent = () => {
//     const commonProps = {
//       requests,
//       setRequests,
//       systemContext,
//       setSystemContext,
//       onProcessRequests: handleProcessRequests,
//       isProcessing,
//       onSave: handleSave,
//       executionStatus
//     };

//     switch (settings.chatType) {
//       case ChatType.SEQUENTIAL:
//         return <SequentialChat {...commonProps} />;
//       case ChatType.BASE:
//       default:
//         return <BaseChat {...commonProps} />;
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col">
//       <Header />
      
//       <SystemContextModal
//         isOpen={isSystemContextModalOpen}
//         onClose={() => setIsSystemContextModalOpen(false)}
//         content={systemContext}
//         onSave={handleSaveSystemContext}
//         onDelete={handleDeleteSystemContext}
//       />
      
//       <ChatBanner
//         chatType={settings.chatType}
//         title={title}
//         settings={settings}
//         onSettingsChange={handleSettingsChange}
//         onTitleChange={setTitle}
//         onSystemContextClick={handleSystemContextClick}
//         hasSystemContext={!!systemContext}
//         onAddStep={settings.chatType === ChatType.SEQUENTIAL ? handleAddStep : undefined}
//       />
      
//       <main className="flex-1 flex overflow-hidden">
//         {renderChatComponent()}
//       </main>
//     </div>
//   );
// };

// export default ChatPage;



// src/pages/chat/ChatPage.tsx
// import React, { useState, useEffect } from 'react';
// import Header from "@/components/Banner/MainBanner/MainHeader";
// import ChatBanner from '@/components/Banner/ChatBanner/ChatBanner';
// import BaseChat from '@/components/Chat/BasicChat/BaseChatMainPage';
// import SequentialChat from '@/components/Chat/Sequential/SequentialChatMainPage';
// import SystemContextModal from '@/components/features/SystemsContext/SystemContextModal';
// import { useApiService } from '@/services/api/hooks/useAPIRequest';
// import { ApiProvider } from '@/services/api/interfaces/api.types';
// import {
//   ChatType,
//   ChatSettings,
//   ChatRequest,
//   Role,
//   ChatResponse,
//   SequentialStepType,
//   ChatDocument
// } from '@/utils/types/chat.types';

// const DEFAULT_SETTINGS: ChatSettings = {
//   temperature: 0.7,
//   chatType: ChatType.BASE,
//   savingParams: {
//     saveToApplication: true,
//     saveToFile: false,
//   }
// };

// const ChatPage: React.FC = () => {
//   // Common state
//   const [title, setTitle] = useState("New Chat");
//   const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
//   const [requests, setRequests] = useState<ChatRequest[]>([]);
//   const [systemContext, setSystemContext] = useState<string>('');
//   const [temporarySystemContext, setTemporarySystemContext] = useState<string>('');
//   const [isSystemContextModalOpen, setIsSystemContextModalOpen] = useState(false);
//   const [selectedAPI] = useState(ApiProvider.OPENAI);
//   const { processRequests, isProcessing, setIsProcessing } = useApiService(systemContext);
  
//   // Initialize requests if empty
//   useEffect(() => {
//     if (requests.length === 0) {
//       setRequests([{
//         id: '1',
//         role: Role.USER,
//         type: ChatType.BASE,
//         step: SequentialStepType.MESSAGE,
//         content: '',
//         status: 'pending',
//         number: 1
//       }]);
//     }
//   }, []);

//   // System Context handlers
//   const handleOpenSystemContext = () => {
//     setTemporarySystemContext(systemContext);
//     setIsSystemContextModalOpen(true);
//   };

//   const handleSaveSystemContext = (content: string) => {
//     setSystemContext(content);
//     const newSettings = { ...settings };
//     newSettings.systemContext = content;
//     setSettings(newSettings);
//   };

//   const handleDeleteSystemContext = () => {
//     setSystemContext('');
//     const newSettings = { ...settings };
//     newSettings.systemContext = '';
//     setSettings(newSettings);
//   };

//   // Handle settings changes
//   const handleSettingsChange = (newSettings: ChatSettings) => {
//     setSettings(newSettings);
    
//     // Reset requests when changing chat type if needed
//     if (newSettings.chatType !== settings.chatType) {
//       setRequests([{
//         id: '1',
//         role: Role.USER,
//         type: newSettings.chatType,
//         step: SequentialStepType.MESSAGE,
//         content: '',
//         status: 'pending',
//         number: 1
//       }]);
//     }
//   };

//   // Common handlers
//   const handleProcessRequests = async () => {
//     try {
//       setIsProcessing(true);
//       await processRequests(requests, selectedAPI);
//     } catch (error) {
//       console.error('Request failed:', error);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   // Save chat document
//   const handleSave = async (chatDoc: ChatDocument) => {
//     // Implement save functionality
//     console.log('Saving chat:', chatDoc);
//   };

//   // Render appropriate chat component based on type
//   const renderChatComponent = () => {
//     const commonProps = {
//       requests,
//       setRequests,
//       systemContext,
//       setSystemContext,
//       onProcessRequests: handleProcessRequests,
//       isProcessing,
//       onSave: handleSave
//     };

//     switch (settings.chatType) {
//       case ChatType.SEQUENTIAL:
//         return <SequentialChat {...commonProps} />;
//       case ChatType.BASE:
//       default:
//         return <BaseChat {...commonProps} />;
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col">
//       <Header />
//       <SystemContextModal
//         isOpen={isSystemContextModalOpen}
//         onClose={() => setIsSystemContextModalOpen(false)}
//         content={systemContext}
//         onSave={handleSaveSystemContext}
//         onDelete={handleDeleteSystemContext}
//         temporaryContent={temporarySystemContext}
//         setTemporaryContent={setTemporarySystemContext}
//       />
//       <ChatBanner
//         chatType={ChatType.SEQUENTIAL}
//         title={title}
//         settings={settings}
//         onSettingsChange={handleSettingsChange}
//         onTitleChange={setTitle}
//         onSystemContextClick={() => setShowSystemContext(!showSystemContext)}
//         hasSystemContext={!!systemContext}
//         onAddStep={(type) => addStep(type === 'pause' ? SequentialStepType.PAUSE : SequentialStepType.DELAY)}
//       />
//       <main className="flex-1 flex overflow-hidden">
//         {renderChatComponent()}
//       </main>
//     </div>
//   );
// };

// export default ChatPage;




// src/pages/chat/ChatPage.tsx
// import React, { useState, useEffect } from 'react';
// import Header from "@/components/Banner/MainBanner/MainHeader";
// import ChatBanner from '@/components/Banner/ChatBanner/ChatBanner';
// import BaseChat from '@/components/Chat/BasicChat/BaseChatMainPage';
// import SequentialChat from '@/components/Chat/Sequential/SequentialChatMainPage';
// import { useApiService } from '@/hooks/useAPIRequest';
// import { ApiProvider } from '@/services/api/interfaces/api.types';
// import {
//   ChatType,
//   ChatSettings,
//   ChatRequest,
//   Role,
//   ChatResponse,
//   ChatDocument
// } from '@/utils/types/chat.types';

// const DEFAULT_SETTINGS: ChatSettings = {
//   temperature: 0.7,
//   chatType: ChatType.BASE,
//   savingParams: {
//     saveToApplication: true,
//     saveToFile: false,
//   }
// };

// const ChatPage: React.FC = () => {
//   // Common state
//   const [title, setTitle] = useState("New Chat");
//   const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
//   const [requests, setRequests] = useState<ChatRequest[]>([]);
//   const [systemContext, setSystemContext] = useState<string>('');
//   const [selectedAPI] = useState(ApiProvider.OPENAI);
//   const { processRequests, isProcessing, setIsProcessing } = useApiService(systemContext);

//   // Initialize requests if empty
//   useEffect(() => {
//     if (requests.length === 0) {
//       setRequests([{
//         id: '1',
//         role: Role.USER,
//         type: ChatType.BASE,
//         step: 'chat',
//         content: '',
//         status: 'pending',
//         number: 1
//       }]);
//     }
//   }, []);

//   // Handle settings changes
//   const handleSettingsChange = (newSettings: ChatSettings) => {
//     setSettings(newSettings);
    
//     // Reset requests when changing chat type if needed
//     if (newSettings.chatType !== settings.chatType) {
//       setRequests([{
//         id: '1',
//         role: Role.USER,
//         type: newSettings.chatType,
//         step: 'chat',
//         content: '',
//         status: 'pending',
//         number: 1
//       }]);
//     }
//   };

//   // Common handlers
//   const handleProcessRequests = async () => {
//     try {
//       setIsProcessing(true);
//       await processRequests(requests, selectedAPI);
//     } catch (error) {
//       console.error('Request failed:', error);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   // Save chat document
//   const handleSave = async (chatDoc: ChatDocument) => {
//     // Implement save functionality
//     console.log('Saving chat:', chatDoc);
//   };

//   // Render appropriate chat component based on type
//   const renderChatComponent = () => {
//     const commonProps = {
//       requests,
//       setRequests,
//       systemContext,
//       setSystemContext,
//       onProcessRequests: handleProcessRequests,
//       isProcessing,
//       onSave: handleSave
//     };

//     switch (settings.chatType) {
//       case ChatType.SEQUENTIAL:
//         return <SequentialChat {...commonProps} />;
//       case ChatType.BASE:
//       default:
//         return <BaseChat {...commonProps} />;
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col">
//       <Header />
//       <ChatBanner
//         chatType={settings.chatType}
//         title={title}
//         settings={settings}
//         onSettingsChange={handleSettingsChange}
//         onTitleChange={setTitle}
//       />
//       <main className="flex-1 flex overflow-hidden">
//         {renderChatComponent()}
//       </main>
//     </div>
//   );
// };

// export default ChatPage;