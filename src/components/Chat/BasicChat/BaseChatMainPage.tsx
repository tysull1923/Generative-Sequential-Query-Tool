// src/pages/chat/components/BaseChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ChatCard from '@/components/features/ChatCards/ChatCard';
import SystemContextCard from '@/components/features/SystemsContext/SystemContextCard';
import ResponsePanel from '@/components/features/Responses/ResponsePanel';
import {
  ChatType,
  ChatRequest,
  ChatDocument,
  Role,
  FileAttachment,
  ExecutionStatus,
  ChatCardState,
  SequentialStepType
} from '@/utils/types/chat.types';

interface BaseChatProps {
  requests: ChatRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChatRequest[]>>;
  systemContext: string;
  setSystemContext: React.Dispatch<React.SetStateAction<string>>;
  onProcessRequests: (requestId: string) => Promise<void>;
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
  const [showSystemContext, setShowSystemContext] = useState(false);
  const [attachments, setAttachments] = useState<Record<string, FileAttachment[]>>({});
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new requests are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [requests]);

  // Handlers
  const addNewRequest = () => {
    const newRequest: ChatRequest = {
      id: Date.now().toString(),
      role: Role.USER,
      type: ChatType.BASE,
      //step: SequentialStepType,
      content: '',
      status: ChatCardState.READY,
      number: requests.length + 1
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
    
    for (let i = index; i < newRequests.length; i++) {
      newRequests[i] = {
        ...newRequests[i],
        number: newRequests[i].number - 1
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

  const handleSaveResponse = (id: string) => {
    const request = requests.find(r => r.id === id);
    if (request?.response) {
      // Implement save functionality
      onSave({
        id,
        title: `Chat ${request.number}`,
        type: ChatType.BASE,
        messages: [],
        responses: [request.response],
        settings: {
          temperature: 0.7,
          chatType: ChatType.BASE
        },
        executionStatus: ExecutionStatus.COMPLETED,
        lastModified: new Date(),
        createdAt: new Date()
      });
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
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

        {/* Completed Requests Display */}
        <div className="space-y-4">
          {requests
            .filter(request => request.status === ChatCardState.COMPLETE)
            .map(request => (
              <div 
                key={request.id} 
                className="space-y-4"
                onClick={() => setSelectedRequestId(request.id)}
              >
                {/* Request - Right aligned, 2/3 width */}
                <div className="ml-auto w-2/3 bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  {request.content}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Response Panel - Only show when a request is selected */}
      {selectedRequestId && (
        <div className="fixed top-4 right-4 bottom-32 w-2/3">
          <ResponsePanel
            selectedRequestId={selectedRequestId}
            requests={requests}
            onSaveResponse={handleSaveResponse}
          />
        </div>
      )}

      {/* Input Area - Centered at bottom */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-1/2 z-10">
        {/* Only show the current (pending) request card */}
        {requests
          .filter(request => request.status === ChatCardState.READY)
          .slice(-1)
          .map(request => (
            <ChatCard
              key={request.id}
              id={request.id}
              number={request.number}
              content={request.content || ''}
              status={request.status}
              chatType={ChatType.BASE}
              isFirst={false}
              isLast={true}
              attachments={attachments[request.id]}
              onMove={moveRequest}
              onDelete={deleteRequest}
              onContentChange={updateRequestContent}
              onSend={() => onProcessRequests(request.id)}
              onAttach={handleAttachment}
              onRemoveAttachment={handleRemoveAttachment}
            />
          ))}

        {/* Add new chat card if there are no pending requests */}
        {!requests.some(req => req.status === ChatCardState.READY) && (
          <div 
            onClick={addNewRequest}
            className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <p className="text-gray-600">Click to start a new chat</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseChat;

// import React, { useState, useRef } from 'react';
// import { AlertCircle } from 'lucide-react';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import ChatCard from '@/components/Chat/Sequential/seqChatCardChatCard';
// import ResponseCard from '@/components/features/Responses/ResponseCard';
// import SystemContextCard from '@/components/features/SystemsContext/SystemContextCard';
// import {
//   ChatCardState,
//   ChatRequest,
//   ChatDocument,
//   Role,
//   FileAttachment,
//   ChatType
// } from '@/utils/types/chat.types';
// import ResponsePanel from '@/components/features/Responses/ResponsePanel';


// interface BaseChatProps {
//   requests: ChatRequest[];
//   setRequests: React.Dispatch<React.SetStateAction<ChatRequest[]>>;
//   systemContext: string;
//   setSystemContext: React.Dispatch<React.SetStateAction<string>>;
//   onProcessRequests: () => Promise<void>;
//   isProcessing: boolean;
//   onSave: (chat: ChatDocument) => void;
// }

// const BaseChat: React.FC<BaseChatProps> = ({
//   requests,
//   setRequests,
//   systemContext,
//   setSystemContext,
//   onProcessRequests,
//   isProcessing,
//   onSave
// }) => {
//   // State
//   const [error, setError] = useState<string | null>(null);
//   const [pendingMessage, setPendingMessage] = useState('');
//   const [attachments, setAttachments] = useState<FileAttachment[]>([]);
//   const [showSystemContext, setShowSystemContext] = useState(false);

//   // Refs
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const chatContainerRef = useRef<HTMLDivElement>(null);

//   // Handlers
//   const handleSendMessage = async () => {
//     if (!pendingMessage.trim() && attachments.length === 0) return;

//     try {
//       const newRequest: ChatRequest = {
//         id: Date.now().toString(),
//         role: Role.USER,
//         type: ChatType.BASE,
//         step: 'chat',
//         content: pendingMessage,
//         status: 'pending',
//         number: requests.length + 1
//       };

//       setRequests(prev => [...prev, newRequest]);
//       setPendingMessage('');
//       setAttachments([]);
      
//       await onProcessRequests();
//     } catch (err) {
//       setError('Failed to send message');
//       console.error(err);
//     }
//   };

//   const handleFileAttachment = (files: FileList | null) => {
//     if (!files) return;

//     const newAttachments: FileAttachment[] = Array.from(files).map(file => ({
//       id: Date.now().toString(),
//       name: file.name,
//       type: file.type,
//       size: file.size,
//       content: file
//     }));

//     setAttachments(prev => [...prev, ...newAttachments]);
//   };

//   return (
//     <div className="flex flex-col h-full w-full">
//       {error && (
//         <Alert variant="destructive" className="m-4">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
//         <ChatCard
//         {/* System Context */}
//         {/* {showSystemContext && (
//           <SystemContextCard
//             content={systemContext}
//             onContentChange={setSystemContext}
//             onDelete={() => {
//               setShowSystemContext(false);
//               setSystemContext('');
//             }}
//           />
//         )} */}

//         {/* Chat Messages */}
//         {/* {requests.map((request) => (
//           <div key={request.id} className="space-y-4">
//             <ChatCard
//               content={request.content || ''}
//               status={request.status === 'pending' ? ChatCardState.READY : ChatCardState.SENT}
//               onDelete={() => {
//                 setRequests(prev => prev.filter(r => r.id !== request.id));
//               }}
//               onEdit={(newContent) => {
//                 setRequests(prev =>
//                   prev.map(r =>
//                     r.id === request.id ? { ...r, content: newContent } : r
//                   )
//                 );
//               }}
//             />
//             {request.response && (
//               <ResponsePanel
//                 response={request.response}
//                 isEditable={true}
//                 onSave={() => {/* Implement save functionality *
//               />
//             )}
//           </div>
//         ))} */}
//       </div>

//       {/* Input Area */}
//       {/* <div className="border-t p-4">
//         <div className="relative">
//           <textarea
//             value={pendingMessage}
//             onChange={e => setPendingMessage(e.target.value)}
//             placeholder="Type your message..."
//             className="w-full p-3 pr-24 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             rows={3}
//             disabled={isProcessing}
//             onKeyDown={e => {
//               if (e.key === 'Enter' && !e.shiftKey) {
//                 e.preventDefault();
//                 handleSendMessage();
//               }
//             }}
//           />
//           <div className="absolute right-2 bottom-2 flex items-center space-x-2">
//             <input
//               ref={fileInputRef}
//               type="file"
//               multiple
//               className="hidden"
//               onChange={e => handleFileAttachment(e.target.files)}
//             />
//             <button
//               onClick={() => fileInputRef.current?.click()}
//               className="p-2 text-gray-500 hover:text-blue-500 rounded-md"
//               disabled={isProcessing}
//             >
//               Attach
//             </button>
//             <button
//               onClick={handleSendMessage}
//               className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
//               disabled={isProcessing || (!pendingMessage.trim() && attachments.length === 0)}
//             >
//               Send
//             </button>
//           </div>
//         </div> */}

//         {/* Attachments Preview */}
//         {/* {attachments.length > 0 && (
//           <div className="mt-2 flex flex-wrap gap-2">
//             {attachments.map(file => (
//               <div
//                 key={file.id}
//                 className="flex items-center bg-gray-50 px-2 py-1 rounded-md text-sm"
//               >
//                 <span className="truncate max-w-[200px]">{file.name}</span>
//                 <button
//                   onClick={() => setAttachments(prev => prev.filter(f => f.id !== file.id))}
//                   className="ml-2 text-gray-500 hover:text-red-500"
//                 >
//                   ×
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div> */}
//     </div>
//   );
// };

// export default BaseChat;