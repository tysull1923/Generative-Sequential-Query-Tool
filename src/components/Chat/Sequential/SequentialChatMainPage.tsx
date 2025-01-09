import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import ResponsePanel from '@/components/features/Responses/ResponsePanel';
import ChatCard from '@/components/features/ChatCards/ChatCard';
import SystemContextCard from '@/components/features/SystemsContext/SystemContextCard';
import PauseStepCard from '@/components/features/ChatStepCards/PauseStepCard';
import DelayStepCard from '@/components/features/ChatStepCards/DelayStepCard';
import {
  ChatDocument,
  Role,
  ChatType,
  ChatSettings,
  ExecutionStatus,
  SequentialStepType,
  ChatRequest,
  FileAttachment,
  ChatCardState
} from '@/utils/types/chat.types';

interface SequentialChatProps {
  requests: ChatRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChatRequest[]>>;
  systemContext: string;
  setSystemContext: React.Dispatch<React.SetStateAction<string>>;
  onProcessRequests: (requestId: string) => Promise<void>;
  isProcessing: boolean;
  onSave?: (chat: ChatDocument) => void;
  title?: string;
  executionStatus?: ExecutionStatus;
}

const MIN_PANEL_WIDTH = 300;
const MAX_PANEL_WIDTH = 1200;

const SequentialChat: React.FC<SequentialChatProps> = ({
  requests,
  setRequests,
  systemContext,
  setSystemContext,
  onProcessRequests,
  isProcessing,
  onSave,
  title,
  executionStatus: initialExecutionStatus = ExecutionStatus.IDLE,
}) => {
  // Local state
  const [error, setError] = useState<string | null>(null);
  const [showSystemContext, setShowSystemContext] = useState(false);
  const [attachments, setAttachments] = useState<Record<string, FileAttachment[]>>({});
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(window.innerWidth / 3);
  const [isResizing, setIsResizing] = useState(false);
  const [localExecutionStatus, setLocalExecutionStatus] = useState<ExecutionStatus>(initialExecutionStatus);

  // Update the processSequentialRequests function
  const processSequentialRequests = async () => {
    if (localExecutionStatus === ExecutionStatus.RUNNING) return;
    
    setLocalExecutionStatus(ExecutionStatus.RUNNING);
    
    try {
      const sortedRequests = [...requests].sort((a, b) => a.position - b.position);
      
      for (const request of sortedRequests) {
        if (localExecutionStatus === ExecutionStatus.PAUSED) break;

        if (request.step === SequentialStepType.PAUSE && request.isPaused) {
          setLocalExecutionStatus(ExecutionStatus.PAUSED);
          break;
        }

        if (request.step === SequentialStepType.DELAY && request.duration) {
          await new Promise(resolve => setTimeout(resolve, request.duration * 1000));
        }

        if (request.step === SequentialStepType.MESSAGE) {
          await onProcessRequests(request.id);
        }
      }

      setLocalExecutionStatus(ExecutionStatus.COMPLETED);
    } catch (error) {
      console.error('Error processing sequential requests:', error);
      setError('Failed to process requests');
      setLocalExecutionStatus(ExecutionStatus.ERROR);
    }
  };

  // Refs
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Resize handlers
  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    const constrainedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, newWidth));
    setLeftPanelWidth(constrainedWidth);
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResize]);

  // Auto scroll to bottom when new requests are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [requests]);

  // Request/Step Management
  const addNewRequest = () => {
    const newRequest: ChatRequest = {
      id: Date.now().toString(),
      role: Role.USER,
      type: ChatType.SEQUENTIAL,
      step: SequentialStepType.MESSAGE,
      content: '',
      status: ChatCardState.READY,
      number: requests.length + 1,
      position: requests.length + 1
    };
    setRequests(prev => [...prev, newRequest]);
  };

  const addPauseStep = () => {
    const newRequest: ChatRequest = {
      id: Date.now().toString(),
      role: Role.SYSTEM,
      type: ChatType.SEQUENTIAL,
      step: SequentialStepType.PAUSE,
      content: '',
      status: ChatCardState.READY,
      number: requests.length + 1,
      position: requests.length + 1,
      isPaused: true
    };
    setRequests(prev => [...prev, newRequest]);
  };

  const addDelayStep = () => {
    const newRequest: ChatRequest = {
      id: Date.now().toString(),
      role: Role.SYSTEM,
      type: ChatType.SEQUENTIAL,
      step: SequentialStepType.DELAY,
      content: '',
      status: ChatCardState.READY,
      number: requests.length + 1,
      position: requests.length + 1,
      duration: 5
    };
    setRequests(prev => [...prev, newRequest]);
  };

  const handleAttachment = (id: string, files: FileList) => {
    const newAttachments = Array.from(files).map(file => ({
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      content: file
    }));

    setAttachments(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), ...newAttachments]
    }));
  };

  const handleRemoveAttachment = (requestId: string, attachmentId: string) => {
    setAttachments(prev => ({
      ...prev,
      [requestId]: prev[requestId]?.filter(att => att.id !== attachmentId) || []
    }));
  };

  const moveRequest = (id: string, direction: 'up' | 'down') => {
    const index = requests.findIndex(r => r.id === id);
    if ((direction === 'up' && index === 0) ||
        (direction === 'down' && index === requests.length - 1)) return;

    const newRequests = [...requests];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const tempPosition = newRequests[index].position;
    newRequests[index].position = newRequests[swapIndex].position;
    newRequests[swapIndex].position = tempPosition;
    
    [newRequests[index], newRequests[swapIndex]] = 
    [newRequests[swapIndex], newRequests[index]];

    setRequests(newRequests);
  };

  const deleteRequest = (id: string) => {
    const index = requests.findIndex(r => r.id === id);
    const newRequests = requests.filter(req => req.id !== id);
    
    // Update positions
    for (let i = index; i < newRequests.length; i++) {
      newRequests[i] = {
        ...newRequests[i],
        position: i + 1
      };
    }

    setRequests(newRequests);
    setAttachments(prev => {
      const newAttachments = { ...prev };
      delete newAttachments[id];
      return newAttachments;
    });
    
    if (selectedRequestId === id) {
      setSelectedRequestId(null);
    }
  };

  const updateRequestContent = (id: string, content: string) => {
    setRequests(requests.map(req =>
      req.id === id ? { ...req, content } : req
    ));
  };

  const togglePauseStep = (id: string) => {
    setRequests(requests.map(req => {
      if (req.id === id && req.step === SequentialStepType.PAUSE) {
        return {
          ...req,
          isPaused: !req.isPaused
        };
      }
      return req;
    }));
  };

  const updateDelayDuration = (id: string, duration: number) => {
    setRequests(requests.map(req => {
      if (req.id === id && req.step === SequentialStepType.DELAY) {
        return {
          ...req,
          duration
        };
      }
      return req;
    }));
  };

  const handleSettingsChange = (newSettings: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleSaveResponse = (id: string) => {
    const request = requests.find(r => r.id === id);
    if (request?.response && onSave) {
      onSave({
        id,
        title: title || `Sequential Chat ${request.number}`,
        type: ChatType.SEQUENTIAL,
        messages: [],
        responses: [request.response],
        settings,
        executionStatus,
        lastModified: new Date(),
        createdAt: new Date()
      });
    }
  };

  // Sequential Execution
  // const processSequentialRequests = async () => {
  //   if (executionStatus === ExecutionStatus.RUNNING) return;
    
  //   setExecutionStatus(ExecutionStatus.RUNNING);
  //   setIsProcessing(true);
    
  //   try {
  //     const sortedRequests = [...requests].sort((a, b) => a.position - b.position);
      
  //     for (const request of sortedRequests) {
  //       if (executionStatus === ExecutionStatus.PAUSED) break;

  //       if (request.step === SequentialStepType.PAUSE && request.isPaused) {
  //         setExecutionStatus(ExecutionStatus.PAUSED);
  //         break;
  //       }

  //       if (request.step === SequentialStepType.DELAY && request.duration) {
  //         await new Promise(resolve => setTimeout(resolve, request.duration * 1000));
  //       }

  //       if (request.step === SequentialStepType.MESSAGE) {
  //         await onProcessRequests(request.id);
  //       }
  //     }

  //     setExecutionStatus(ExecutionStatus.COMPLETED);
  //   } catch (error) {
  //     console.error('Error processing sequential requests:', error);
  //     setError('Failed to process requests');
  //     setExecutionStatus(ExecutionStatus.ERROR);
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  return (
    <div ref={containerRef} className="flex h-full relative">
      {error && (
        <Alert variant="destructive" className="absolute top-4 right-4 z-50">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Left Panel - Requests */}
      <div 
        className="border-r bg-background overflow-y-auto flex-shrink-0"
        style={{ width: leftPanelWidth }}
        ref={chatContainerRef}
      >
        <div className="p-4 space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              onClick={processSequentialRequests}
              disabled={isProcessing}
              variant={isProcessing ? "secondary" : "default"}
            >
              {isProcessing ? 'Processing...' : 'Execute'}
            </Button>
            <Button onClick={addNewRequest} variant="outline">
              Add Message
            </Button>
            <Button onClick={addPauseStep} variant="outline">
              Add Pause
            </Button>
            <Button onClick={addDelayStep} variant="outline">
              Add Delay
            </Button>
          </div>

          {showSystemContext && (
            <SystemContextCard
              content={systemContext}
              onContentChange={setSystemContext}
              onDelete={() => {
                setShowSystemContext(false);
                setSystemContext('');
              }}
            />
          )}

          {requests
            .sort((a, b) => a.position - b.position)
            .map((request, index) => {
              switch (request.step) {
                case SequentialStepType.PAUSE:
                  return (
                    <PauseStepCard
                      key={request.id}
                      id={request.id}
                      number={index + 1}
                      isPaused={request.isPaused || false}
                      onToggle={() => togglePauseStep(request.id)}
                      onDelete={() => deleteRequest(request.id)}
                      onMove={(direction) => moveRequest(request.id, direction)}
                      isFirst={index === 0}
                      isLast={index === requests.length - 1}
                    />
                  );
                case SequentialStepType.DELAY:
                  return (
                    <DelayStepCard
                      key={request.id}
                      id={request.id}
                      number={index + 1}
                      duration={request.duration || 5}
                      onDurationChange={(duration) => updateDelayDuration(request.id, duration)}
                      onDelete={() => deleteRequest(request.id)}
                      onMove={(direction) => moveRequest(request.id, direction)}
                      isFirst={index === 0}
                      isLast={index === requests.length - 1}
                    />
                  );
                default:
                  return (
                    <ChatCard
                      key={request.id}
                      id={request.id}
                      number={index + 1}
                      content={request.content || ''}
                      status={request.status}
                      chatType={ChatType.SEQUENTIAL}
                      isFirst={index === 0}
                      isLast={index === requests.length - 1}
                      attachments={attachments[request.id]}
                      onMove={moveRequest}
                      onDelete={deleteRequest}
                      onContentChange={updateRequestContent}
                      onAttach={handleAttachment}
                      onRemoveAttachment={handleRemoveAttachment}
                      onClick={() => setSelectedRequestId(request.id)}
                      response={request.response}
                    />
                  );
              }
            })}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeHandleRef}
        className="absolute h-full w-1 cursor-ew-resize select-none hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
        style={{ left: leftPanelWidth }}
        onMouseDown={handleResizeStart}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-blue-100">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Right Panel - Responses */}
      <div 
        className="bg-background overflow-hidden"
        style={{ width: `calc(100% - ${leftPanelWidth}px)` }}
      >
        <ResponsePanel
          selectedRequestId={selectedRequestId}
          requests={requests.map(request => ({
            id: request.id,
            response: request.response
          }))}
          onSaveResponse={handleSaveResponse}
          className="h-full"
        />
      </div>
      {/* <div className="flex-1 overflow-hidden bg-background">
        {selectedRequestId && (
          <div className="h-full w-full p-4">
            <ResponsePanel
              selectedRequestId={selectedRequestId}
              requests={requests.map(request => ({
                id: request.id,
                response: request.response
              }))}
              onSaveResponse={handleSaveResponse}
            />
          </div>
        )}
        {!selectedRequestId && (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            Select a message to view its response
          </div>
        )}
      </div> */}
    </div>
  );
};

export default SequentialChat;


// import React, { useState, useCallback, useRef, useEffect } from 'react';
// import { Plus, GripVertical } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import SequentialPromptsPlayPause from '@/components/Chat/Sequential/SequentialPromptsPlayPause';
// import ChatCard from '@/components/features/ChatCards/ChatCard';
// import PauseStepCard from '@/components/features/ChatStepCards/PauseStepCard';
// import ResponsePanel from '@/components/features/Responses/ResponsePanel';
// import SystemContextCard from '@/components/features/SystemsContext/SystemContextCard';
// import {
//   ChatRequest,
//   ChatDocument,
//   Role,
//   ChatType,
//   SequentialStepType
// } from '@/utils/types/chat.types';

// interface SequentialChatProps {
//   requests: ChatRequest[];
//   setRequests: React.Dispatch<React.SetStateAction<ChatRequest[]>>;
//   systemContext: string;
//   setSystemContext: React.Dispatch<React.SetStateAction<string>>;
//   onProcessRequests: () => Promise<void>;
//   isProcessing: boolean;
//   onSave: (chat: ChatDocument) => void;
// }

// const MIN_PANEL_WIDTH = 300;
// const MAX_PANEL_WIDTH = 1200;

// const SequentialChat: React.FC<SequentialChatProps> = ({
//   requests,
//   setRequests,
//   systemContext,
//   setSystemContext,
//   onProcessRequests,
//   isProcessing,
//   onSave
// }) => {
//   // State
//   const [showSystemContext, setShowSystemContext] = useState(false);
//   const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
//   const [leftPanelWidth, setLeftPanelWidth] = useState(window.innerWidth / 3);
//   const [isResizing, setIsResizing] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // Refs
//   const resizeHandleRef = useRef<HTMLDivElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);

//   // Resize handler
//   const handleResize = useCallback((e: MouseEvent) => {
//     if (!isResizing || !containerRef.current) return;

//     const containerRect = containerRef.current.getBoundingClientRect();
//     const newWidth = e.clientX - containerRect.left;
    
//     const constrainedWidth = Math.max(
//       MIN_PANEL_WIDTH,
//       Math.min(MAX_PANEL_WIDTH, newWidth)
//     );

//     setLeftPanelWidth(constrainedWidth);
//   }, [isResizing]);

//   // Handle resize start/end
//   const handleResizeStart = (e: React.MouseEvent) => {
//     e.preventDefault();
//     setIsResizing(true);
//     document.body.style.cursor = 'ew-resize';
//     document.body.style.userSelect = 'none';
//   };

//   const handleResizeEnd = () => {
//     setIsResizing(false);
//     document.body.style.cursor = 'default';
//     document.body.style.userSelect = 'auto';
//   };

//   // Add/remove event listeners
//   useEffect(() => {
//     if (isResizing) {
//       window.addEventListener('mousemove', handleResize);
//       window.addEventListener('mouseup', handleResizeEnd);
//     }

//     return () => {
//       window.removeEventListener('mousemove', handleResize);
//       window.removeEventListener('mouseup', handleResizeEnd);
//     };
//   }, [isResizing, handleResize]);

//   // Handlers
//   const addPauseStep = (afterId: string) => {
//     const index = requests.findIndex(r => r.id === afterId);
//     const afterRequest = requests[index];

//     const newRequests = [...requests];
//     newRequests.splice(index + 1, 0, {
//       id: Date.now().toString(),
//       role: Role.SYSTEM,
//       type: ChatType.SEQUENTIAL,
//       step: 'pause',
//       status: 'pending',
//       isPaused: true,
//       number: afterRequest.number + 1
//     });

//     // Update subsequent numbers
//     for (let i = index + 2; i < newRequests.length; i++) {
//       newRequests[i] = {
//         ...newRequests[i],
//         number: newRequests[i].number + 1
//       };
//     }

//     setRequests(newRequests);
//   };

//   const addNewRequest = () => {
//     const newNumber = requests.length > 0 
//       ? Math.max(...requests.map(r => r.number)) + 1 
//       : 1;

//     setRequests([...requests, {
//       id: Date.now().toString(),
//       role: Role.USER,
//       type: ChatType.SEQUENTIAL,
//       step: 'chat',
//       content: '',
//       status: 'pending',
//       number: newNumber
//     }]);
//   };

//   const togglePauseStep = (id: string) => {
//     setRequests(requests.map(req => {
//       if (req.id === id && req.step === 'pause') {
//         return {
//           ...req,
//           isPaused: !req.isPaused,
//           status: !req.isPaused ? 'paused' : 'pending'
//         };
//       }
//       return req;
//     }));
//   };

//   const moveRequest = (id: string, direction: 'up' | 'down') => {
//     const index = requests.findIndex(r => r.id === id);
//     if ((direction === 'up' && index === 0) ||
//         (direction === 'down' && index === requests.length - 1)) return;

//     const newRequests = [...requests];
//     const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
//     const tempNumber = newRequests[index].number;
//     newRequests[index].number = newRequests[swapIndex].number;
//     newRequests[swapIndex].number = tempNumber;
    
//     [newRequests[index], newRequests[swapIndex]] = 
//     [newRequests[swapIndex], newRequests[index]];

//     setRequests(newRequests);
//   };

//   const deleteRequest = (id: string) => {
//     const index = requests.findIndex(r => r.id === id);
//     const newRequests = requests.filter(req => req.id !== id);
    
//     for (let i = index; i < newRequests.length; i++) {
//       newRequests[i] = {
//         ...newRequests[i],
//         number: newRequests[i].number - 1
//       };
//     }

//     setRequests(newRequests);
//     if (selectedRequestId === id) {
//       setSelectedRequestId(null);
//     }
//   };

//   const updateRequestContent = (id: string, content: string) => {
//     setRequests(requests.map(req =>
//       req.id === id ? { ...req, content } : req
//     ));
//   };

//   return (
//     <div ref={containerRef} className="flex h-full relative">
//       {/* Left Panel - Requests */}
//       <div 
//         className="border-r bg-background overflow-y-auto flex-shrink-0"
//         style={{ width: leftPanelWidth }}
//       >
//         <div className="p-4 space-y-4">
//           <SequentialPromptsPlayPause
//             onAddStep={() => {/* Handle step addition */}}
//             onPlay={onProcessRequests}
//             onPause={() => {/* Implement pause functionality */}}
//             isPlaying={isProcessing}
//           />

//           {showSystemContext && (
//             <SystemContextCard
//               content={systemContext}
//               onContentChange={setSystemContext}
//               onDelete={() => {
//                 setShowSystemContext(false);
//                 setSystemContext('');
//               }}
//             />
//           )}

//           {requests.map((request, index) => (
//             request.step === 'pause' ? (
//               <PauseStepCard
//                 key={request.id}
//                 number={request.number}
//                 isPaused={request.isPaused || false}
//                 onToggle={() => togglePauseStep(request.id)}
//                 onDelete={() => deleteRequest(request.id)}
//               />
//             ) : (
//               <ChatCard
//                 key={request.id}
//                 id={request.id}
//                 number={request.number}
//                 content={request.content || ''}
//                 status={request.status}
//                 chatType={ChatType.SEQUENTIAL}
//                 isFirst={index === 0}
//                 isLast={index === requests.length - 1}
//                 onMove={moveRequest}
//                 onDelete={deleteRequest}
//                 onContentChange={updateRequestContent}
//                 //onAddPause={addPauseStep}
//                 onClick={() => setSelectedRequestId(request.id)}
//                 response={request.response ? String(request.response.content) : ''}
//               />
//             )
//           ))}

//           <Button
//             onClick={addNewRequest}
//             className="w-full flex items-center justify-center gap-2"
//             disabled={isProcessing}
//           >
//             <Plus className="h-4 w-4" />
//             Add New Request
//           </Button>
//         </div>
//       </div>

//       {/* Resize Handle */}
//       <div
//         ref={resizeHandleRef}
//         className="absolute h-full w-1 cursor-ew-resize select-none hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
//         style={{ left: leftPanelWidth }}
//         onMouseDown={handleResizeStart}
//       >
//         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-blue-100">
//           <GripVertical className="h-5 w-5 text-gray-400" />
//         </div>
//       </div>

//       {/* Right Panel - Responses */}
//       <div className="flex-1 overflow-hidden">
//         <ResponsePanel
//           selectedRequestId={selectedRequestId}
//           requests={requests}
//           onSaveResponse={(id) => {
//             // Implement save functionality
//             console.log('Saving response for request:', id);
//           }}
//         />
//       </div>
//     </div>
//   );
// };

// export default SequentialChat;

// import React, { useState, useCallback, useRef, useEffect } from 'react';
// import { Plus, GripVertical } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import SequentialPromptsPlayPause from '@/components/Chat/Sequential/SequentialPromptsPlayPause';
// import ChatCard from '@/components/Chat/Sequential/seqChatCard';
// import PauseStepCard from '@/components/features/ChatStepCards/PauseStepCard';
// import ResponsePanel from '@/components/features/Responses/ResponsePanel';
// import SystemContextCard from '@/components/features/SystemsContext/SystemContextCard';
// import {
//   ChatRequest,
//   ChatDocument,
//   Role,
//   ChatType,
//   SequentialStepType
// } from '@/utils/types/chat.types';

// interface SequentialChatProps {
//   requests: ChatRequest[];
//   setRequests: React.Dispatch<React.SetStateAction<ChatRequest[]>>;
//   systemContext: string;
//   setSystemContext: React.Dispatch<React.SetStateAction<string>>;
//   onProcessRequests: () => Promise<void>;
//   isProcessing: boolean;
//   onSave: (chat: ChatDocument) => void;
// }

// const MIN_PANEL_WIDTH = 300; // Minimum width in pixels
// const MAX_PANEL_WIDTH = 1200; // Maximum width in pixels

// const SequentialChat: React.FC<SequentialChatProps> = ({
//   requests,
//   setRequests,
//   systemContext,
//   setSystemContext,
//   onProcessRequests,
//   isProcessing,
//   onSave
// }) => {
//   // State
//   const [showSystemContext, setShowSystemContext] = useState(false);
//   const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
//   const [leftPanelWidth, setLeftPanelWidth] = useState(window.innerWidth / 3);
//   const [isResizing, setIsResizing] = useState(false);

//   // Refs
//   const resizeHandleRef = useRef<HTMLDivElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);

//   // Resize handler
//   const handleResize = useCallback((e: MouseEvent) => {
//     if (!isResizing || !containerRef.current) return;

//     const containerRect = containerRef.current.getBoundingClientRect();
//     const newWidth = e.clientX - containerRect.left;
    
//     // Constrain width between MIN_PANEL_WIDTH and MAX_PANEL_WIDTH
//     const constrainedWidth = Math.max(
//       MIN_PANEL_WIDTH,
//       Math.min(MAX_PANEL_WIDTH, newWidth)
//     );

//     setLeftPanelWidth(constrainedWidth);
//   }, [isResizing]);

//   // Handle resize start/end
//   const handleResizeStart = (e: React.MouseEvent) => {
//     e.preventDefault();
//     setIsResizing(true);
//     document.body.style.cursor = 'ew-resize';
//     document.body.style.userSelect = 'none';
//   };

//   const handleResizeEnd = () => {
//     setIsResizing(false);
//     document.body.style.cursor = 'default';
//     document.body.style.userSelect = 'auto';
//   };

//   // Add/remove event listeners
//   useEffect(() => {
//     if (isResizing) {
//       window.addEventListener('mousemove', handleResize);
//       window.addEventListener('mouseup', handleResizeEnd);
//     }

//     return () => {
//       window.removeEventListener('mousemove', handleResize);
//       window.removeEventListener('mouseup', handleResizeEnd);
//     };
//   }, [isResizing, handleResize]);

  

//   // Handlers
//   const addPauseStep = (afterId: string) => {
//     const index = requests.findIndex(r => r.id === afterId);
//     const afterRequest = requests[index];

//     const newRequests = [...requests];
//     newRequests.splice(index + 1, 0, {
//       id: Date.now().toString(),
//       role: Role.SYSTEM,
//       type: ChatType.SEQUENTIAL,
//       step: 'pause',
//       status: 'pending',
//       isPaused: true,
//       number: afterRequest.number + 1
//     });

//     // Update subsequent numbers
//     for (let i = index + 2; i < newRequests.length; i++) {
//       newRequests[i] = {
//         ...newRequests[i],
//         number: newRequests[i].number + 1
//       };
//     }

//     setRequests(newRequests);
//   };

//   const addNewRequest = () => {
//     const newNumber = requests.length > 0 
//       ? Math.max(...requests.map(r => r.number)) + 1 
//       : 1;

//     setRequests([...requests, {
//       id: Date.now().toString(),
//       role: Role.USER,
//       type: ChatType.SEQUENTIAL,
//       step: 'chat',
//       content: '',
//       status: 'pending',
//       number: newNumber
//     }]);
//   };

//   const togglePauseStep = (id: string) => {
//     setRequests(requests.map(req => {
//       if (req.id === id && req.step === 'pause') {
//         return {
//           ...req,
//           isPaused: !req.isPaused,
//           status: !req.isPaused ? 'paused' : 'pending'
//         };
//       }
//       return req;
//     }));
//   };

//   const moveRequest = (id: string, direction: 'up' | 'down') => {
//     const index = requests.findIndex(r => r.id === id);
//     if ((direction === 'up' && index === 0) ||
//         (direction === 'down' && index === requests.length - 1)) return;

//     const newRequests = [...requests];
//     const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
//     // Swap positions and numbers
//     const tempNumber = newRequests[index].number;
//     newRequests[index].number = newRequests[swapIndex].number;
//     newRequests[swapIndex].number = tempNumber;
    
//     [newRequests[index], newRequests[swapIndex]] = 
//     [newRequests[swapIndex], newRequests[index]];

//     setRequests(newRequests);
//   };

//   const deleteRequest = (id: string) => {
//     const index = requests.findIndex(r => r.id === id);
//     const newRequests = requests.filter(req => req.id !== id);
    
//     // Update subsequent numbers
//     for (let i = index; i < newRequests.length; i++) {
//       newRequests[i] = {
//         ...newRequests[i],
//         number: newRequests[i].number - 1
//       };
//     }

//     setRequests(newRequests);
//   };

//   const updateRequestContent = (id: string, content: string) => {
//     setRequests(requests.map(req =>
//       req.id === id ? { ...req, content } : req
//     ));
//   };

//   const saveResponse = (id: string) => {
//     const request = requests.find(r => r.id === id);
//     if (!request?.response) return;
//     // Implement save functionality
//     console.log('Saving response for request:', id);
//   };

//   return (
//     <div ref={containerRef} className="flex h-full relative">
//       {/* Left Panel - Requests */}
//       <div 
//         className="border-r bg-background overflow-y-auto flex-shrink-0"
//         style={{ width: leftPanelWidth }}
//       >
//         <div className="p-4 space-y-4">
//           <SequentialPromptsPlayPause
//             onAddStep={() => {/* Handle step addition */}}
//             onPlay={onProcessRequests}
//             onPause={() => {/* Implement pause functionality */}}
//             isPlaying={isProcessing}
//           />

//           {showSystemContext && (
//             <SystemContextCard
//               content={systemContext}
//               onContentChange={setSystemContext}
//               onDelete={() => {
//                 setShowSystemContext(false);
//                 setSystemContext('');
//               }}
//             />
//           )}

//           {/* Chat Steps */}
//           {requests.map((request, index) => (
//             request.step === 'pause' ? (
//               <PauseStepCard
//                 key={request.id}
//                 number={request.number}
//                 isPaused={request.isPaused || false}
//                 onToggle={() => togglePauseStep(request.id)}
//                 onDelete={() => deleteRequest(request.id)}
//               />
//             ) : (
//               <ChatCard
//                 key={request.id}
//                 id={request.id}
//                 number={request.number}
//                 content={request.content || ''}
//                 status={request.status}
//                 isFirst={index === 0}
//                 isLast={index === requests.length - 1}
//                 onMove={moveRequest}
//                 onDelete={deleteRequest}
//                 onContentChange={updateRequestContent}
//                 onAddPause={addPauseStep}
//                 onClick={() => setSelectedRequestId(request.id)}
//                 response={request.response ? String(request.response.content) : ''}
//               />
//             )
//           ))}

//           <Button
//             onClick={addNewRequest}
//             className="w-full flex items-center justify-center gap-2"
//           >
//             <Plus className="h-4 w-4" />
//             Add New Request
//           </Button>
//         </div>
//       </div>

//       {/* Resize Handle */}
//       <div
//         ref={resizeHandleRef}
//         className="absolute h-full w-1 cursor-ew-resize select-none hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
//         style={{ left: leftPanelWidth }}
//         onMouseDown={handleResizeStart}
//       >
//         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-blue-100">
//           <GripVertical className="h-5 w-5 text-gray-400" />
//         </div>
//       </div>

//       {/* Right Panel - Responses */}
//       <div className="flex-1 overflow-hidden">
//         <ResponsePanel
//           selectedRequestId={selectedRequestId}
//           requests={requests}
//           onSaveResponse={saveResponse}
//         />
//       </div>
//     </div>
//   );
// };

// export default SequentialChat;















// import React, { useState } from 'react';
// import { Plus } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import SequentialPromptsPlayPause from '@/components/Chat/Sequential/SequentialPromptsPlayPause';
// import ChatCard from '@/components/Chat/Sequential/seqChatCard';
// import PauseStepCard from '@/components/features/PauseStepCard';
// import ResponsePanel from '@/components/features/ResponsePanel';
// import SystemContextCard from '@/components/features/SystemsContext/SystemContextCard';
// import {
//   ChatRequest,
//   ChatDocument,
//   Role,
//   ChatType,
//   SequentialStepType
// } from '@/utils/types/chat.types';

// interface SequentialChatProps {
//   requests: ChatRequest[];
//   setRequests: React.Dispatch<React.SetStateAction<ChatRequest[]>>;
//   systemContext: string;
//   setSystemContext: React.Dispatch<React.SetStateAction<string>>;
//   onProcessRequests: () => Promise<void>;
//   isProcessing: boolean;
//   onSave: (chat: ChatDocument) => void;
// }

// const SequentialChat: React.FC<SequentialChatProps> = ({
//   requests,
//   setRequests,
//   systemContext,
//   setSystemContext,
//   onProcessRequests,
//   isProcessing,
//   onSave
// }) => {
//   // State
//   const [showSystemContext, setShowSystemContext] = useState(false);
//   const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

//   // Handlers
//   const addPauseStep = (afterId: string) => {
//     const index = requests.findIndex(r => r.id === afterId);
//     const afterRequest = requests[index];

//     const newRequests = [...requests];
//     newRequests.splice(index + 1, 0, {
//       id: Date.now().toString(),
//       role: Role.SYSTEM,
//       type: ChatType.SEQUENTIAL,
//       step: 'pause',
//       status: 'pending',
//       isPaused: true,
//       number: afterRequest.number + 1
//     });

//     // Update subsequent numbers
//     for (let i = index + 2; i < newRequests.length; i++) {
//       newRequests[i] = {
//         ...newRequests[i],
//         number: newRequests[i].number + 1
//       };
//     }

//     setRequests(newRequests);
//   };

//   const addNewRequest = () => {
//     const newNumber = requests.length > 0 
//       ? Math.max(...requests.map(r => r.number)) + 1 
//       : 1;

//     setRequests([...requests, {
//       id: Date.now().toString(),
//       role: Role.USER,
//       type: ChatType.SEQUENTIAL,
//       step: 'chat',
//       content: '',
//       status: 'pending',
//       number: newNumber
//     }]);
//   };

//   const togglePauseStep = (id: string) => {
//     setRequests(requests.map(req => {
//       if (req.id === id && req.step === 'pause') {
//         return {
//           ...req,
//           isPaused: !req.isPaused,
//           status: !req.isPaused ? 'paused' : 'pending'
//         };
//       }
//       return req;
//     }));
//   };

//   const moveRequest = (id: string, direction: 'up' | 'down') => {
//     const index = requests.findIndex(r => r.id === id);
//     if ((direction === 'up' && index === 0) ||
//         (direction === 'down' && index === requests.length - 1)) return;

//     const newRequests = [...requests];
//     const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
//     // Swap positions and numbers
//     const tempNumber = newRequests[index].number;
//     newRequests[index].number = newRequests[swapIndex].number;
//     newRequests[swapIndex].number = tempNumber;
    
//     [newRequests[index], newRequests[swapIndex]] = 
//     [newRequests[swapIndex], newRequests[index]];

//     setRequests(newRequests);
//   };

//   const deleteRequest = (id: string) => {
//     const index = requests.findIndex(r => r.id === id);
//     const newRequests = requests.filter(req => req.id !== id);
    
//     // Update subsequent numbers
//     for (let i = index; i < newRequests.length; i++) {
//       newRequests[i] = {
//         ...newRequests[i],
//         number: newRequests[i].number - 1
//       };
//     }

//     setRequests(newRequests);
//   };

//   const updateRequestContent = (id: string, content: string) => {
//     setRequests(requests.map(req =>
//       req.id === id ? { ...req, content } : req
//     ));
//   };

//   const saveResponse = (id: string) => {
//     const request = requests.find(r => r.id === id);
//     if (!request?.response) return;
//     // Implement save functionality
//     console.log('Saving response for request:', id);
//   };

//   return (
//     <div className="flex h-full">
//       {/* Left Panel - Requests (1/3 width)  */}
//       <div className="w-1/3 border-r p-4 bg-background overflow-y-auto">
//         <div className="space-y-4">
//           <SequentialPromptsPlayPause
//             onAddStep={() => {/* Handle step addition */}}
//             onPlay={onProcessRequests}
//             onPause={() => {/* Implement pause functionality */}}
//             isPlaying={isProcessing}
//           />

//           {/* System Context */}
//           {/* {!showSystemContext && (
//             <Button
//               onClick={() => setShowSystemContext(true)}
//               className="w-full flex items-center justify-center gap-2 mb-4"
//               variant="outline"
//             >
//               <Plus className="h-4 w-4" />
//               Add System Context
//             </Button>
//           )} */}

//           {showSystemContext && (
//             <SystemContextCard
//               content={systemContext}
//               onContentChange={setSystemContext}
//               onDelete={() => {
//                 setShowSystemContext(false);
//                 setSystemContext('');
//               }}
//             />
//           )}

//           {/* Chat Steps */}
//           {requests.map((request, index) => (
//             request.step === 'pause' ? (
//               <PauseStepCard
//                 key={request.id}
//                 number={request.number}
//                 isPaused={request.isPaused || false}
//                 onToggle={() => togglePauseStep(request.id)}
//                 onDelete={() => deleteRequest(request.id)}
//               />
//             ) : (
//               <ChatCard
//                 key={request.id}
//                 id={request.id}
//                 number={request.number}
//                 content={request.content || ''}
//                 status={request.status}
//                 isFirst={index === 0}
//                 isLast={index === requests.length - 1}
//                 onMove={moveRequest}
//                 onDelete={deleteRequest}
//                 onContentChange={updateRequestContent}
//                 onAddPause={addPauseStep}
//                 onClick={() => setSelectedRequestId(request.id)}
//                 response={request.response ? String(request.response.content) : ''}
//               />
//             )
//           ))}

//           <Button
//             onClick={addNewRequest}
//             className="w-full flex items-center justify-center gap-2"
//           >
//             <Plus className="h-4 w-4" />
//             Add New Request
//           </Button>
//         </div>
//       </div>

//       {/* Right Panel - Responses (2/3 width) */}
//       <ResponsePanel
//         selectedRequestId={selectedRequestId}
//         requests={requests}
//         onSaveResponse={saveResponse}
//       />
//     </div>
//   );
// };

// export default SequentialChat;