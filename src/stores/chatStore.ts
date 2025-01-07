/**
 * @fileoverview Chat store implementation using Zustand
 */

/**
 * @fileoverview Chat store implementation using Zustand
 */
/**
 * @fileoverview Chat store implementation using Zustand and ChatService
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import ChatService from '../services/database/chatService';

import { 
  ChatType, 
  ChatSettings, 
  ChatStep, 
  BaseMessage,
  FileMessage,
  ChatResponse, 
  ChatDocument,
  ExecutionStatus
} from '@/utils/types/chat.types';
import { ApiService } from '@/services/api/APIService';



/**
 * Interface for the chat store state
 */
interface ChatState {
  activeChat: ChatDocument | null;
  chatHistory: Record<string, ChatDocument>;
  chatSettings: ChatSettings;
  executionStatus: ExecutionStatus;
  loading: boolean;
  error: Error | null;
  
  // Actions
  createChat: (type: ChatType) => Promise<string>;
  loadChat: (id: string) => Promise<void>;
  updateChat: (id: string, updates: Partial<ChatDocument>) => Promise<void>;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  executeSequential: (chatId: string) => Promise<void>;
  addStep: (chatId: string, step: ChatStep) => Promise<void>;
  moveStep: (chatId: string, stepId: string, direction: 'up' | 'down') => Promise<void>;
  saveChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  exportChat: (chatId: string, format: 'json' | 'markdown') => Promise<void>;
  setError: (error: Error | null) => void;
}

/**
 * Default chat settings
 */
const DEFAULT_SETTINGS: ChatSettings = {
  temperature: 0.7,
  chatType: ChatType.BASE,
  savingParams: {
    saveToApplication: true,
    saveToFile: false
  }
};

/**
 * Create the chat store with persistence and ChatService integration
 */
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      // Initialize services
      const chatService = ChatService.getInstance();
      const apiService = new ApiService({
        baseURL: process.env.VITE_API_URL || '',
        apiKey: process.env.VITE_API_KEY || ''
      });

      return {
        // Initial state
        activeChat: null,
        chatHistory: {},
        chatSettings: DEFAULT_SETTINGS,
        executionStatus: ExecutionStatus.IDLE,
        loading: false,
        error: null,

        /**
         * Create a new chat
         */
        createChat: async (type: ChatType) => {
          try {
            set({ loading: true, error: null });
            
            const newChat: ChatDocument = {
              type,
              id: '1',
              title: 'New Chat',
              settings: { ...DEFAULT_SETTINGS, chatType: type },
              messages: [],
              responses: [],
              steps: type === ChatType.SEQUENTIAL ? [] : undefined,
              executionStatus: type === ChatType.SEQUENTIAL ? ExecutionStatus.IDLE : undefined,
              lastModified: new Date(),
              createdAt: new Date()
            };

            const chatId = await chatService.createChat(newChat);
            const createdChat = await chatService.getChat(chatId);

            set(state => ({
              chatHistory: { ...state.chatHistory, [chatId]: createdChat },
              activeChat: createdChat
            }));

            return chatId;
          } catch (error) {
            set({ error: error as Error });
            throw error;
          } finally {
            set({ loading: false });
          }
        },

        /**
         * Load a chat from the database
         */
        loadChat: async (id: string) => {
          try {
            set({ loading: true, error: null });
            
            const chat = await chatService.getChat(id);
            if (!chat) throw new Error('Chat not found');

            set(state => ({
              chatHistory: { ...state.chatHistory, [id]: chat },
              activeChat: chat
            }));
          } catch (error) {
            set({ error: error as Error });
            throw error;
          } finally {
            set({ loading: false });
          }
        },

        /**
         * Update a chat's properties
         */
        updateChat: async (id: string, updates: Partial<ChatDocument>) => {
          try {
            set({ loading: true, error: null });
            
            await chatService.updateChat(id, {
              ...updates,
              lastModified: new Date()
            });

            const updatedChat = await chatService.getChat(id);
            if (!updatedChat) throw new Error('Chat not found after update');

            set(state => ({
              chatHistory: { ...state.chatHistory, [id]: updatedChat },
              activeChat: state.activeChat?.id === id ? updatedChat : state.activeChat
            }));
          } catch (error) {
            set({ error: error as Error });
            throw error;
          } finally {
            set({ loading: false });
          }
        },

        /**
         * Send a message in the active chat
         */
        sendMessage: async (content: string, attachments?: File[]) => {
          try {
            const { activeChat } = get();
            if (!activeChat) throw new Error('No active chat');

            set({ loading: true, error: null });

            // Create message
            const message: BaseMessage | FileMessage = attachments?.length ? {
                id: Date.now().toString(),
                content,
                timestamp: Date.now(),
                sender: 'user',
                attachments: attachments.map(file => ({
                    id: Date.now().toString(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: file  // Store the actual File object
                }))
            } : {
                id: Date.now().toString(),
                content,
                timestamp: Date.now(),
                sender: 'user'
            };

            // Send to API
            const response = await apiService.sendMessage({
              message,
              settings: activeChat.settings
            });

            // Update chat document
            await chatService.updateChat(activeChat.id, {
              messages: [...activeChat.messages, message],
              responses: [...activeChat.responses, response],
              lastModified: new Date()
            });

            // Reload chat to get updated state
            await get().loadChat(activeChat.id);
          } catch (error) {
            set({ error: error as Error });
            throw error;
          } finally {
            set({ loading: false });
          }
        },

        /**
         * Execute a sequential chat
         */
        executeSequential: async (chatId: string) => {
          try {
            const chat = await chatService.getChat(chatId);
            if (!chat || chat.type !== ChatType.SEQUENTIAL) {
              throw new Error('Invalid chat type');
            }

            set({ loading: true, error: null, executionStatus: ExecutionStatus.RUNNING });

            for (const step of chat.steps || []) {
              if (get().executionStatus === ExecutionStatus.PAUSED) {
                return;
              }

              switch (step.type) {
                case 'pause':
                  set({ executionStatus: ExecutionStatus.PAUSED });
                  return;
                case 'delay':
                  await new Promise(resolve => setTimeout(resolve, step.duration * 1000));
                  break;
                case 'message':
                  if (step.message) {
                    await get().sendMessage(step.message.content);
                  }
                  break;
              }
            }

            set({ executionStatus: ExecutionStatus.COMPLETED });
          } catch (error) {
            set({ error: error as Error, executionStatus: ExecutionStatus.ERROR });
            throw error;
          } finally {
            set({ loading: false });
          }
        },

        /**
         * Add a step to a sequential chat
         */
        addStep: async (chatId: string, step: ChatStep) => {
          try {
            const chat = await chatService.getChat(chatId);
            if (!chat || chat.type !== ChatType.SEQUENTIAL) {
              throw new Error('Invalid chat type');
            }

            set({ loading: true, error: null });

            await chatService.updateChat(chatId, {
              steps: [...(chat.steps || []), step],
              lastModified: new Date()
            });

            await get().loadChat(chatId);
          } catch (error) {
            set({ error: error as Error });
            throw error;
          } finally {
            set({ loading: false });
          }
        },

        /**
         * Move a step up or down in a sequential chat
         */
        moveStep: async (chatId: string, stepId: string, direction: 'up' | 'down') => {
          try {
            const chat = await chatService.getChat(chatId);
            if (!chat || chat.type !== ChatType.SEQUENTIAL || !chat.steps) {
              throw new Error('Invalid chat type');
            }

            set({ loading: true, error: null });

            const stepIndex = chat.steps.findIndex(step => step.id === stepId);
            if (stepIndex === -1) throw new Error('Step not found');

            const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
            if (newIndex < 0 || newIndex >= chat.steps.length) return;

            const steps = [...chat.steps];
            [steps[stepIndex], steps[newIndex]] = [steps[newIndex], steps[stepIndex]];

            await chatService.updateChat(chatId, {
              steps,
              lastModified: new Date()
            });

            await get().loadChat(chatId);
          } catch (error) {
            set({ error: error as Error });
            throw error;
          } finally {
            set({ loading: false });
          }
        },

        /**
         * Save chat to database
         */
        saveChat: async (chatId: string) => {
          try {
            const chat = await chatService.getChat(chatId);
            if (!chat) throw new Error('Chat not found');

            set({ loading: true, error: null });

            await chatService.updateChat(chatId, {
              lastModified: new Date()
            });

            if (chat.settings.savingParams?.saveToFile) {
              // Handle file export if needed
              await get().exportChat(chatId, 'json');
            }
          } catch (error) {
            set({ error: error as Error });
            throw error;
          } finally {
            set({ loading: false });
          }
        },

        /**
         * Delete a chat
         */
        deleteChat: async (chatId: string) => {
          try {
            set({ loading: true, error: null });

            await chatService.deleteChat(chatId);

            set(state => {
              const { [chatId]: _, ...remainingChats } = state.chatHistory;
              return {
                chatHistory: remainingChats,
                activeChat: state.activeChat?.id === chatId ? null : state.activeChat
              };
            });
          } catch (error) {
            set({ error: error as Error });
            throw error;
          } finally {
            set({ loading: false });
          }
        },

        /**
         * Export chat to file
         */
        exportChat: async (chatId: string, format: 'json' | 'markdown') => {
          try {
            const chat = await chatService.getChat(chatId);
            if (!chat) throw new Error('Chat not found');

            set({ loading: true, error: null });

            // Implement export logic here
            // This would depend on your file storage service implementation
          } catch (error) {
            set({ error: error as Error });
            throw error;
          } finally {
            set({ loading: false });
          }
        },

        /**
         * Set error state
         */
        setError: (error: Error | null) => {
          set({ error });
        }
      };
    },
    {
      name: 'chat-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        chatSettings: state.chatSettings
      })
    }
  )
);

// Export type for use in components
export type ChatStore = ReturnType<typeof useChatStore>;









// import { create } from 'zustand';
// import { persist, createJSONStorage } from 'zustand/middleware';
// import { 
//   ChatType, 
//   ChatSettings, 
//   ChatStep, 
//   BaseMessage,
//   FileMessage,
//   ChatResponse 
// } from '@/utils/types/chat.types';
// import { ApiService } from '@/services/api/APIService';
// import { DatabaseService } from '@/services/database/DataBaseService';
// import { FileStorageService } from '@/services/storage/FileStorageService';

// /**
//  * Execution status for sequential chats
//  */
// export enum ExecutionStatus {
//   IDLE = 'idle',
//   RUNNING = 'running',
//   PAUSED = 'paused',
//   COMPLETED = 'completed',
//   ERROR = 'error'
// }

// /**
//  * Interface for a chat in the store
//  */
// export interface Chat {
//   id: string;
//   type: ChatType;
//   title: string;
//   settings: ChatSettings;
//   messages: (BaseMessage | FileMessage)[];
//   responses: ChatResponse[];
//   steps?: ChatStep[];
//   executionStatus?: ExecutionStatus;
//   lastModified: number;
//   createdAt: number;
// }

// /**
//  * Interface for the chat store state
//  */
// interface ChatState {
//   activeChat: Chat | null;
//   chatHistory: Record<string, Chat>;
//   chatSettings: ChatSettings;
//   executionStatus: ExecutionStatus;
//   loading: boolean;
//   error: Error | null;
  
//   // Actions
//   createChat: (type: ChatType) => Promise<string>;
//   loadChat: (id: string) => Promise<void>;
//   updateChat: (id: string, updates: Partial<Chat>) => Promise<void>;
//   sendMessage: (content: string, attachments?: File[]) => Promise<void>;
//   executeSequential: (chatId: string) => Promise<void>;
//   addStep: (chatId: string, step: ChatStep) => Promise<void>;
//   moveStep: (chatId: string, stepId: string, direction: 'up' | 'down') => Promise<void>;
//   saveChat: (chatId: string) => Promise<void>;
//   deleteChat: (chatId: string) => Promise<void>;
//   exportChat: (chatId: string, format: 'json' | 'markdown') => Promise<void>;
//   setError: (error: Error | null) => void;
// }

// /**
//  * Default chat settings
//  */
// const DEFAULT_SETTINGS: ChatSettings = {
//   temperature: 0.7,
//   chatType: ChatType.BASE,
//   savingParams: {
//     saveToApplication: true,
//     saveToFile: false
//   }
// };

// /**
//  * Create the chat store with persistence
//  */
// export const useChatStore = create<ChatState>()(
//   persist(
//     (set, get) => ({
//       // Initial state
//       activeChat: null,
//       chatHistory: {},
//       chatSettings: DEFAULT_SETTINGS,
//       executionStatus: ExecutionStatus.IDLE,
//       loading: false,
//       error: null,

//       /**
//        * Create a new chat
//        * @param type Chat type to create
//        * @returns New chat ID
//        */
//       createChat: async (type: ChatType) => {
//         try {
//           set({ loading: true, error: null });
          
//           const id = Date.now().toString();
//           const newChat: Chat = {
//             id,
//             type,
//             title: 'New Chat',
//             settings: { ...DEFAULT_SETTINGS, chatType: type },
//             messages: [],
//             responses: [],
//             steps: type === ChatType.SEQUENTIAL ? [] : undefined,
//             executionStatus: type === ChatType.SEQUENTIAL ? ExecutionStatus.IDLE : undefined,
//             lastModified: Date.now(),
//             createdAt: Date.now()
//           };

//           set(state => ({
//             chatHistory: { ...state.chatHistory, [id]: newChat },
//             activeChat: newChat
//           }));

//           await DatabaseService.saveChat(newChat);
//           return id;
//         } catch (error) {
//           set({ error: error as Error });
//           throw error;
//         } finally {
//           set({ loading: false });
//         }
//       },

//       /**
//        * Load a chat from the database
//        * @param id Chat ID to load
//        */
//       loadChat: async (id: string) => {
//         try {
//           set({ loading: true, error: null });
          
//           const chat = await DatabaseService.getChat(id);
//           if (!chat) throw new Error('Chat not found');

//           set(state => ({
//             chatHistory: { ...state.chatHistory, [id]: chat },
//             activeChat: chat
//           }));
//         } catch (error) {
//           set({ error: error as Error });
//           throw error;
//         } finally {
//           set({ loading: false });
//         }
//       },

//       /**
//        * Update a chat's properties
//        * @param id Chat ID to update
//        * @param updates Partial chat updates
//        */
//       updateChat: async (id: string, updates: Partial<Chat>) => {
//         try {
//           set({ loading: true, error: null });
          
//           const chat = get().chatHistory[id];
//           if (!chat) throw new Error('Chat not found');

//           const updatedChat = {
//             ...chat,
//             ...updates,
//             lastModified: Date.now()
//           };

//           set(state => ({
//             chatHistory: { ...state.chatHistory, [id]: updatedChat },
//             activeChat: state.activeChat?.id === id ? updatedChat : state.activeChat
//           }));

//           await DatabaseService.updateChat(updatedChat);
//         } catch (error) {
//           set({ error: error as Error });
//           throw error;
//         } finally {
//           set({ loading: false });
//         }
//       },

//       /**
//        * Send a message in the active chat
//        * @param content Message content
//        * @param attachments Optional file attachments
//        */
//       sendMessage: async (content: string, attachments?: File[]) => {
//         try {
//           const { activeChat } = get();
//           if (!activeChat) throw new Error('No active chat');

//           set({ loading: true, error: null });

//           // Handle file uploads
//           let uploadedFiles = [];
//           if (attachments?.length) {
//             uploadedFiles = await Promise.all(
//               attachments.map(file => FileStorageService.uploadFile(file))
//             );
//           }

//           // Create message
//           const message: BaseMessage | FileMessage = attachments?.length ? {
//             id: Date.now().toString(),
//             content,
//             timestamp: Date.now(),
//             sender: 'user',
//             attachments: uploadedFiles
//           } : {
//             id: Date.now().toString(),
//             content,
//             timestamp: Date.now(),
//             sender: 'user'
//           };

//           // Send to API
//           const response = await ApiService.sendMessage({
//             message,
//             settings: activeChat.settings
//           });

//           // Update chat
//           const updatedChat = {
//             ...activeChat,
//             messages: [...activeChat.messages, message],
//             responses: [...activeChat.responses, response],
//             lastModified: Date.now()
//           };

//           set(state => ({
//             chatHistory: { ...state.chatHistory, [activeChat.id]: updatedChat },
//             activeChat: updatedChat
//           }));

//           await DatabaseService.updateChat(updatedChat);
//         } catch (error) {
//           set({ error: error as Error });
//           throw error;
//         } finally {
//           set({ loading: false });
//         }
//       },

//       /**
//        * Execute a sequential chat
//        * @param chatId Chat ID to execute
//        */
//       executeSequential: async (chatId: string) => {
//         try {
//           const chat = get().chatHistory[chatId];
//           if (!chat || chat.type !== ChatType.SEQUENTIAL) {
//             throw new Error('Invalid chat type');
//           }

//           set({ loading: true, error: null, executionStatus: ExecutionStatus.RUNNING });

//           for (const step of chat.steps || []) {
//             if (get().executionStatus === ExecutionStatus.PAUSED) {
//               return;
//             }

//             switch (step.type) {
//               case 'pause':
//                 set({ executionStatus: ExecutionStatus.PAUSED });
//                 return;
//               case 'delay':
//                 await new Promise(resolve => setTimeout(resolve, step.duration * 1000));
//                 break;
//               case 'message':
//                 await get().sendMessage(step.message.content);
//                 break;
//             }
//           }

//           set({ executionStatus: ExecutionStatus.COMPLETED });
//         } catch (error) {
//           set({ error: error as Error, executionStatus: ExecutionStatus.ERROR });
//           throw error;
//         } finally {
//           set({ loading: false });
//         }
//       },

//       /**
//        * Add a step to a sequential chat
//        * @param chatId Chat ID to add step to
//        * @param step Step to add
//        */
//       addStep: async (chatId: string, step: ChatStep) => {
//         try {
//           const chat = get().chatHistory[chatId];
//           if (!chat || chat.type !== ChatType.SEQUENTIAL) {
//             throw new Error('Invalid chat type');
//           }

//           set({ loading: true, error: null });

//           const updatedChat = {
//             ...chat,
//             steps: [...(chat.steps || []), step],
//             lastModified: Date.now()
//           };

//           set(state => ({
//             chatHistory: { ...state.chatHistory, [chatId]: updatedChat },
//             activeChat: state.activeChat?.id === chatId ? updatedChat : state.activeChat
//           }));

//           await DatabaseService.updateChat(updatedChat);
//         } catch (error) {
//           set({ error: error as Error });
//           throw error;
//         } finally {
//           set({ loading: false });
//         }
//       },

//       /**
//        * Move a step up or down in a sequential chat
//        * @param chatId Chat ID containing the step
//        * @param stepId Step ID to move
//        * @param direction Direction to move the step
//        */
//       moveStep: async (chatId: string, stepId: string, direction: 'up' | 'down') => {
//         try {
//           const chat = get().chatHistory[chatId];
//           if (!chat || chat.type !== ChatType.SEQUENTIAL || !chat.steps) {
//             throw new Error('Invalid chat type');
//           }

//           set({ loading: true, error: null });

//           const stepIndex = chat.steps.findIndex(step => step.id === stepId);
//           if (stepIndex === -1) throw new Error('Step not found');

//           const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
//           if (newIndex < 0 || newIndex >= chat.steps.length) return;

//           const steps = [...chat.steps];
//           [steps[stepIndex], steps[newIndex]] = [steps[newIndex], steps[stepIndex]];

//           const updatedChat = {
//             ...chat,
//             steps,
//             lastModified: Date.now()
//           };

//           set(state => ({
//             chatHistory: { ...state.chatHistory, [chatId]: updatedChat },
//             activeChat: state.activeChat?.id === chatId ? updatedChat : state.activeChat
//           }));

//           await DatabaseService.updateChat(updatedChat);
//         } catch (error) {
//           set({ error: error as Error });
//           throw error;
//         } finally {
//           set({ loading: false });
//         }
//       },

//       /**
//        * Save a chat to the database and optionally to a file
//        * @param chatId Chat ID to save
//        */
//       saveChat: async (chatId: string) => {
//         try {
//           const chat = get().chatHistory[chatId];
//           if (!chat) throw new Error('Chat not found');

//           set({ loading: true, error: null });

//           await DatabaseService.saveChat(chat);

//           if (chat.settings.savingParams?.saveToFile) {
//             await FileStorageService.exportChat(chat);
//           }
//         } catch (error) {
//           set({ error: error as Error });
//           throw error;
//         } finally {
//           set({ loading: false });
//         }
//       },

//       /**
//        * Delete a chat
//        * @param chatId Chat ID to delete
//        */
//       deleteChat: async (chatId: string) => {
//         try {
//           set({ loading: true, error: null });

//           await DatabaseService.deleteChat(chatId);

//           set(state => {
//             const { [chatId]: _, ...remainingChats } = state.chatHistory;
//             return {
//               chatHistory: remainingChats,
//               activeChat: state.activeChat?.id === chatId ? null : state.activeChat
//             };
//           });
//         } catch (error) {
//           set({ error: error as Error });
//           throw error;
//         } finally {
//           set({ loading: false });
//         }
//       },

//       /**
//        * Export a chat to a file
//        * @param chatId Chat ID to export
//        * @param format Export format
//        */
//       exportChat: async (chatId: string, format: 'json' | 'markdown') => {
//         try {
//           const chat = get().chatHistory[chatId];
//           if (!chat) throw new Error('Chat not found');

//           set({ loading: true, error: null });

//           await FileStorageService.exportChat(chat, format);
//         } catch (error) {
//           set({ error: error as Error });
//           throw error;
//         } finally {
//           set({ loading: false });
//         }
//       },

//       /**
//        * Set the current error state
//        * @param error Error object or null
//        */
//       setError: (error: Error | null) => {
//         set({ error });
//       }
//     }),
//     {
//       name: 'chat-store',
//       storage: createJSONStorage(() => localStorage),
//       // Only persist non-sensitive data
//       partialize: (state) => ({
//         chatHistory: state.chatHistory,
//         chatSettings: state.chatSettings
//       })
//     }
//   )
// );

// // Export type for use in components
// export type ChatStore = ReturnType<typeof useChatStore>;

// // Usage example:
// /*
// import { useChatStore } from './stores/chatStore';

// function ChatComponent() {
//   const { 
//     activeChat,
//     loading,
//     error,
//     createChat,
//     sendMessage
//   } = useChatStore();

//   const handleNewChat = async () => {
//     try {
//       const chatId = await createChat(ChatType.BASE);
//       console.log('Created new chat:', chatId);
//     } catch (err) {
//       console.error('Failed to create chat:', err);
//     }
//   };

//   const handleSend = async (message: string, files?: File[]) => {
//     try {
//       await sendMessage(message, files);
//     } catch (err) {
//       console.error('Failed to send message:', err);
//     }
//   };

//   return (
//     <div>
//       {loading && <LoadingSpinner />}
//       {error && <ErrorMessage error={error} />}
//       {activeChat && (
//         <ChatView 
//           chat={activeChat}
//           onSend={handleSend}
//         />
//       )}
//     </div>
//   );
// }
// */