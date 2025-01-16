


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
  const [error, setError] = useState<string | null>(null);
  const [showSystemContext, setShowSystemContext] = useState(false);
  const [attachments, setAttachments] = useState<Record<string, FileAttachment[]>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [requests]);

  useEffect(() => {
    if (requests.length === 0) {
      const newRequest: ChatRequest = {
        id: Date.now().toString(),
        role: Role.USER,
        type: ChatType.BASE,
        step: SequentialStepType.MESSAGE,
        content: '',
        status: ChatCardState.READY,
        number: requests.length + 1
      };
  
      setRequests(prev => [newRequest]);
    }
  }, []);

  const addNewRequest = () => {
    const newRequest: ChatRequest = {
      id: Date.now().toString(),
      role: Role.USER,
      type: ChatType.BASE,
      step: SequentialStepType.MESSAGE,
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
  };

  const updateRequestContent = (id: string, content: string) => {
    setRequests(requests.map(req =>
      req.id === id ? { ...req, content } : req
    ));
  };

  const handleSaveResponse = (id: string) => {
    const request = requests.find(r => r.id === id);
    if (request?.response) {
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

        {/* Request-Response Pairs */}
        {/* isFirst was 1 */}
        <div className="space-y-6 mb-32">
          {requests.map((request) => (
            <div key={request.id} className="space-y-4">
              {/* Request Card */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <ChatCard
                  id={request.id}
                  number={request.number}
                  content={request.content || ''}
                  status={request.status}
                  chatType={ChatType.BASE}
                  isFirst={request.number === 1} 
                  isLast={request.number === requests.length}
                  attachments={attachments[request.id]}
                  onMove={moveRequest}
                  onDelete={deleteRequest}
                  onContentChange={updateRequestContent}
                  onSend={() => onProcessRequests(request.id)}
                  onAttach={handleAttachment}
                  onRemoveAttachment={handleRemoveAttachment}
                />
              </div>

              {/* Response Panel - Show directly below if response exists */}
              {request.response?.content && (  // Check specifically for response content
                <div className="bg-white p-4 rounded-lg shadow">
                  <ResponsePanel
                    selectedRequestId={request.id}
                    requests={[request]}
                    onSaveResponse={handleSaveResponse}
                  />
                </div>
              )}
              {/* {request.response && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <ResponsePanel
                    selectedRequestId={request.id}
                    requests={[request]}
                    onSaveResponse={handleSaveResponse}
                  />
                </div>
              )} */}
            </div>
          ))}
        </div>
      </div>

      {/* New Chat Input Area */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-1/2 z-10">
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