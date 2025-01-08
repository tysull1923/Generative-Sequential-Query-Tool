// src/pages/chat/components/SequentialChat.tsx


// src/pages/chat/components/SequentialChat.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SequentialPromptsPlayPause from '@/components/Chat/Sequential/SequentialPromptsPlayPause';
import ChatCard from '@/components/Chat/Sequential/seqChatCard';
import PauseStepCard from '@/components/features/ChatStepCards/PauseStepCard';
import ResponsePanel from '@/components/features/ResponsePanel';
import SystemContextCard from '@/components/features/SystemsContext/SystemContextCard';
import {
  ChatRequest,
  ChatDocument,
  Role,
  ChatType,
  SequentialStepType
} from '@/utils/types/chat.types';

interface SequentialChatProps {
  requests: ChatRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChatRequest[]>>;
  systemContext: string;
  setSystemContext: React.Dispatch<React.SetStateAction<string>>;
  onProcessRequests: () => Promise<void>;
  isProcessing: boolean;
  onSave: (chat: ChatDocument) => void;
}

const MIN_PANEL_WIDTH = 300; // Minimum width in pixels
const MAX_PANEL_WIDTH = 1200; // Maximum width in pixels

const SequentialChat: React.FC<SequentialChatProps> = ({
  requests,
  setRequests,
  systemContext,
  setSystemContext,
  onProcessRequests,
  isProcessing,
  onSave
}) => {
  // State
  const [showSystemContext, setShowSystemContext] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(window.innerWidth / 3);
  const [isResizing, setIsResizing] = useState(false);

  // Refs
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize handler
  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    
    // Constrain width between MIN_PANEL_WIDTH and MAX_PANEL_WIDTH
    const constrainedWidth = Math.max(
      MIN_PANEL_WIDTH,
      Math.min(MAX_PANEL_WIDTH, newWidth)
    );

    setLeftPanelWidth(constrainedWidth);
  }, [isResizing]);

  // Handle resize start/end
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

  // Add/remove event listeners
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

  

  // Handlers
  const addPauseStep = (afterId: string) => {
    const index = requests.findIndex(r => r.id === afterId);
    const afterRequest = requests[index];

    const newRequests = [...requests];
    newRequests.splice(index + 1, 0, {
      id: Date.now().toString(),
      role: Role.SYSTEM,
      type: ChatType.SEQUENTIAL,
      step: 'pause',
      status: 'pending',
      isPaused: true,
      number: afterRequest.number + 1
    });

    // Update subsequent numbers
    for (let i = index + 2; i < newRequests.length; i++) {
      newRequests[i] = {
        ...newRequests[i],
        number: newRequests[i].number + 1
      };
    }

    setRequests(newRequests);
  };

  const addNewRequest = () => {
    const newNumber = requests.length > 0 
      ? Math.max(...requests.map(r => r.number)) + 1 
      : 1;

    setRequests([...requests, {
      id: Date.now().toString(),
      role: Role.USER,
      type: ChatType.SEQUENTIAL,
      step: 'chat',
      content: '',
      status: 'pending',
      number: newNumber
    }]);
  };

  const togglePauseStep = (id: string) => {
    setRequests(requests.map(req => {
      if (req.id === id && req.step === 'pause') {
        return {
          ...req,
          isPaused: !req.isPaused,
          status: !req.isPaused ? 'paused' : 'pending'
        };
      }
      return req;
    }));
  };

  const moveRequest = (id: string, direction: 'up' | 'down') => {
    const index = requests.findIndex(r => r.id === id);
    if ((direction === 'up' && index === 0) ||
        (direction === 'down' && index === requests.length - 1)) return;

    const newRequests = [...requests];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap positions and numbers
    const tempNumber = newRequests[index].number;
    newRequests[index].number = newRequests[swapIndex].number;
    newRequests[swapIndex].number = tempNumber;
    
    [newRequests[index], newRequests[swapIndex]] = 
    [newRequests[swapIndex], newRequests[index]];

    setRequests(newRequests);
  };

  const deleteRequest = (id: string) => {
    const index = requests.findIndex(r => r.id === id);
    const newRequests = requests.filter(req => req.id !== id);
    
    // Update subsequent numbers
    for (let i = index; i < newRequests.length; i++) {
      newRequests[i] = {
        ...newRequests[i],
        number: newRequests[i].number - 1
      };
    }

    setRequests(newRequests);
  };

  const updateRequestContent = (id: string, content: string) => {
    setRequests(requests.map(req =>
      req.id === id ? { ...req, content } : req
    ));
  };

  const saveResponse = (id: string) => {
    const request = requests.find(r => r.id === id);
    if (!request?.response) return;
    // Implement save functionality
    console.log('Saving response for request:', id);
  };

  return (
    <div ref={containerRef} className="flex h-full relative">
      {/* Left Panel - Requests */}
      <div 
        className="border-r bg-background overflow-y-auto flex-shrink-0"
        style={{ width: leftPanelWidth }}
      >
        <div className="p-4 space-y-4">
          <SequentialPromptsPlayPause
            onAddStep={() => {/* Handle step addition */}}
            onPlay={onProcessRequests}
            onPause={() => {/* Implement pause functionality */}}
            isPlaying={isProcessing}
          />

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

          {/* Chat Steps */}
          {requests.map((request, index) => (
            request.step === 'pause' ? (
              <PauseStepCard
                key={request.id}
                number={request.number}
                isPaused={request.isPaused || false}
                onToggle={() => togglePauseStep(request.id)}
                onDelete={() => deleteRequest(request.id)}
              />
            ) : (
              <ChatCard
                key={request.id}
                id={request.id}
                number={request.number}
                content={request.content || ''}
                status={request.status}
                isFirst={index === 0}
                isLast={index === requests.length - 1}
                onMove={moveRequest}
                onDelete={deleteRequest}
                onContentChange={updateRequestContent}
                onAddPause={addPauseStep}
                onClick={() => setSelectedRequestId(request.id)}
                response={request.response ? String(request.response.content) : ''}
              />
            )
          ))}

          <Button
            onClick={addNewRequest}
            className="w-full flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Request
          </Button>
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
      <div className="flex-1 overflow-hidden">
        <ResponsePanel
          selectedRequestId={selectedRequestId}
          requests={requests}
          onSaveResponse={saveResponse}
        />
      </div>
    </div>
  );
};

export default SequentialChat;















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