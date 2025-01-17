// src/pages/chat/ChatPage.tsx
// src/pages/chat/ChatPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAPI } from '@/context/APIContext';
import { useLangChainService } from '@/services/api/langchain/langChainApiService';
import ChatBanner from '@/components/Banner/ChatBanner/ChatBanner';
import BaseChat from '@/components/Chat/BasicChat/BaseChatMainPage';
import SequentialChat from '@/components/Chat/Sequential/SequentialChatMainPage';
import RequirementsChat from '@/components/Chat/RequirementsChat/RequirementsChatMainPage';
import SystemContextModal from '@/components/features/SystemsContext/SystemContextModal';
import {
  ChatType,
  ChatSettings,
  ChatRequest,
  ChatResponse,
  Role,
  ExecutionStatus,
  ChatCardState,
  SequentialStepType
} from '@/utils/types/chat.types';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChatApiService } from '@/services/database/chatDatabaseApiService';

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
  //Database stuff
  const navigate = useNavigate();
  const location = useLocation();
  const initialSettings = {
    ...DEFAULT_SETTINGS,
    chatType: location.state?.selectedChatType || DEFAULT_SETTINGS.chatType
  };
  const chatService = ChatApiService.getInstance();
  const [ isSaving, setIsSaving ] = useState(false);
  // Common state
  const [title, setTitle] = useState("New Chat");
  const [settings, setSettings] = useState<ChatSettings>(initialSettings);
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [systemContext, setSystemContext] = useState<string>('');
  const [isSystemContextModalOpen, setIsSystemContextModalOpen] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [chatResponse, setChatResponse] = useState<ChatResponse>({
    provider: Role.ASSISTANT,
    content: ''
});
  // Get API context and LangChain service
  const { selectedAPI } = useAPI();
  const { 
    processRequests, 
    isProcessing, 
    setIsProcessing,
    initializeHistory,
    checkOllamaConnection 
  } = useLangChainService(
    systemContext,
    { baseUrl: 'http://localhost:11434' }
  );

  // Initialize requests if empty
  // useEffect(() => {
    
  //   if (requests.length === 0) {
  //     setRequests([{
  //       id: '1',
  //       role: Role.USER,
  //       type: settings.chatType,
  //       content: '',
  //       status: ChatCardState.READY,
  //       response: chatResponse,
  //       number: 1
  //     }]);
  //   }
  // }, [settings.chatType]);

  //Put back!
  useEffect(() => {
    if (requests.length === 0) {
      const newRequest: ChatRequest = {
            id: Date.now().toString(),
            role: Role.USER,
            type: settings.chatType,
            step: SequentialStepType.MESSAGE,
            content: '',
            status: ChatCardState.READY,
            number: requests.length + 1
          };
      
      setRequests([newRequest]);
      // setRequests([{
      //   id: Date.now().toString(),
      //   role: Role.USER,
      //   type: settings.chatType,
      //   step: SequentialStepType.MESSAGE,
      //   content: '',
      //   status: ChatCardState.READY,
      //   number: requests.length + 1
      // }]);
    }
  }, [settings.chatType]);
  // response: {
        //   provider: Role.ASSISTANT,
        //   content: ''
        // },

  // Load existing chat if ID is provided
  // useEffect(() => {
  //   const loadExistingChat = async () => {
  //     const chatId = location.state?.chatId;
  //     if (chatId) {
  //       try {
  //         const chatData = await chatService.getChat(chatId);
  //         setTitle(chatData.title);
  //         setSettings(chatData.settings);
  //         setRequests(chatData.messages || []);
  //         setSystemContext(chatData.settings.systemContext || '');
  //       } catch (error) {
  //         console.error('Error loading chat:', error);
  //         // Handle error appropriately
  //       }
  //     }
  //   };

  //   loadExistingChat();
  // }, [location.state?.chatId]);

  useEffect(() => {
    const loadExistingChat = async () => {
      const chatId = location.state?.chatId;
      if (chatId) {
        try {
          const chatData = await chatService.getChat(chatId);
          setTitle(chatData.title);
          setSettings(chatData.settings);
          setSystemContext(chatData.settings.systemContext || '');
          
          // Initialize message history in LangChain service
          initializeHistory(chatData.messages || [], chatData.settings.systemContext);
          
          // Set requests state
          setRequests(chatData.messages || []);
          
        } catch (error) {
          console.error('Error loading chat:', error);
          setError('Failed to load chat history. Please try again.');
        }
      }
    };
  
    loadExistingChat();
  }, [location.state?.chatId]);

  // Process requests handler
  const handleProcessRequests = async (requestP?: string | ChatRequest[]) => {
    setError(null);
    if (settings.chatType === ChatType.SEQUENTIAL){
      try{
        
          const requestsToProcess = requestP;
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
    }
    if (settings.chatType === ChatType.BASE && typeof requestP === "string"){
      try {
        setIsProcessing(true);
        setExecutionStatus(ExecutionStatus.RUNNING);
        
        const requestsToProcess = requestP
          ? [requests.find(r => r.id === requestP)!]
          : requests;
          console.log("Testin:" + requestP);
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
    }
  };

  const handleSettingsChange = (newSettings: Partial<ChatSettings>) => {
    // if (newSettings.chatType && newSettings.chatType !== prev.chatType) {
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
    setSettings(prev => ({ ...prev, ...newSettings }));
    console.log("Old Setting:" + settings.chatType);
    console.log("New Settings:" + newSettings.chatType);
  };

  // const handleSave = async (chatDoc: any) => {
  //   // Implement save functionality
  //   console.log('Saving chat:', chatDoc);
  // };
  // Update handleSave to use ChatApiService
  // const handleSave = async () => {
  //   if (!settings.savingParams?.saveToApplication) {
  //     return; // Don't save if saveToApplication is false
  //   }

  //   try {
  //     setIsSaving(true);
  //     const chatData = {
  //       title,
  //       type: settings.chatType,
  //       settings: {
  //         ...settings,
  //         systemContext
  //       },
  //       messages: requests,
  //       executionStatus: executionStatus,
  //       lastModified: new Date(),
  //       createdAt: new Date()
  //     };

  //     if (location.state?.chatId) {
  //       // Update existing chat
  //       await chatService.updateChat(location.state.chatId, chatData);
  //     } else {
  //       // Create new chat
  //       const chatId = await chatService.createChat(chatData);
  //       // Update URL with new chat ID
  //       navigate(location.pathname, { state: { chatId }, replace: true });
  //     }
  //   } catch (error) {
  //     console.error('Error saving chat:', error);
  //     // Handle error appropriately
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };
  // In chat.tsx
const handleSave = async () => {
  if (!settings.savingParams?.saveToApplication) {
    return;
  }

  try {
    setIsSaving(true);
    
    // Ensure messages are properly formatted
    const formattedRequests = requests.map(req => ({
      id: req.id,
      role: req.role,
      type: req.type,
      content: req.content || '',
      status: req.status,
      response: {
        provider: req.response?.provider || 'assistant',
        content: req.response?.content || ''
      },
      number: req.number
    }));
    // const formattedRequests = requests.map(req => {
    //   const formatted = {
    //     id: req.id,
    //     role: req.role,
    //     type: req.type,
    //     content: req.content || '',
    //     status: req.status,
    //     number: req.number
    //   };
      
    //   // Only add response if it exists
    //   if (req.response) {
    //     formatted.response = {
    //       provider: req.response.provider,
    //       content: req.response.content
    //     };
    //   }
      
    //   return formatted;
    // });

    const chatData = {
      title: title || 'Untitled Chat',
      type: settings.chatType,
      settings: {
        temperature: settings.temperature,
        chatType: settings.chatType,
        systemContext: systemContext || '',
        savingParams: settings.savingParams
      },
      messages: formattedRequests,
      executionStatus: executionStatus,
      lastModified: new Date(),
      createdAt: location.state?.chatId ? undefined : new Date()
    };

    if (location.state?.chatId) {
      await chatService.updateChat(location.state.chatId, chatData);
    } else {
      const chatId = await chatService.createChat(chatData);
      navigate(location.pathname, { state: { chatId }, replace: true });
    }

    console.log('Chat saved successfully');
  } catch (error) {
    console.error('Error saving chat:', error);
  } finally {
    setIsSaving(false);
  }
};

  // Auto-save when requests change
  useEffect(() => {
    if (requests.length > 0 && settings.savingParams?.saveToApplication) {
      handleSave();
    }
  }, [requests]);

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
      case ChatType.REQUIREMENTS:
        return <RequirementsChat {...commonProps} />;
      case ChatType.BASE:
      default:
        return <BaseChat {...commonProps} />;
    }
  };

  return (
    <> 
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {/* Add saving indicator if needed */}
      {isSaving && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded">
          Saving...
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
    </>
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