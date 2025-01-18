import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import ChatCard from '@/components/features/ChatCards/ChatCard';
import SystemContextCard from '@/components/features/SystemsContext/SystemContextCard';
import {
  ChatType,
  ChatRequest,
  ChatDocument,
  Role,
  ExecutionStatus,
  ChatCardState,
  SequentialStepType
} from '@/utils/types/chat.types';

// Components
import RequirementsPromptArea from '@/components/Chat/RequirementsChat/RequirementsPromptArea';
import RequirementsSidePanel from '@/components/Chat/RequirementsChat/RequirementsSidePanel';
import RequirementsResponseCard from '@/components/Chat/RequirementsChat/RequirementsResponseCard';

interface PromptItem {
  id: string;
  content: string;
  sourceRequest: string;
  createdAt: Date;
}

interface RequirementsChatProps {
  requests: ChatRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ChatRequest[]>>;
  systemContext: string;
  setSystemContext: React.Dispatch<React.SetStateAction<string>>;
  onProcessRequests: (requestId: string) => Promise<void>;
  isProcessing: boolean;
  onSave: (chat: ChatDocument) => void;
}

const RequirementsChat: React.FC<RequirementsChatProps> = ({
  requests,
  setRequests,
  systemContext,
  setSystemContext,
  onProcessRequests,
  isProcessing,
  onSave,
}) => {
  // State
  const [error, setError] = useState<string | null>(null);
  const [showSystemContext, setShowSystemContext] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showPromptArea, setShowPromptArea] = useState(false);
  const [promptItems, setPromptItems] = useState<PromptItem[]>([]);
  const [sidePanelWidth, setSidePanelWidth] = useState(300);
  const [promptAreaWidth, setPromptAreaWidth] = useState(300);

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const sidePanelRef = useRef<HTMLDivElement>(null);
  const promptAreaRef = useRef<HTMLDivElement>(null);

  // Effect to handle new messages
  useEffect(() => {
    if (requests.length === 0) {
      const newRequest: ChatRequest = {
        id: Date.now().toString(),
        role: Role.USER,
        type: ChatType.REQUIREMENTS,
        step: SequentialStepType.MESSAGE,
        content: '',
        status: ChatCardState.READY,
        number: 1
      };
      setRequests([newRequest]);
    }
  }, []);

  // Handle add new request
  const addNewRequest = () => {
    setSelectedRequest(null);
    const newRequest: ChatRequest = {
      id: Date.now().toString(),
      role: Role.USER,
      type: ChatType.REQUIREMENTS,
      step: SequentialStepType.MESSAGE,
      content: '',
      status: ChatCardState.READY,
      number: requests.length + 1
    };
    setRequests(prev => [...prev, newRequest]);
  };

  // Handle adding response to prompt area
  const handleAddToPrompt = (requestId: string, content: string) => {
    const newPromptItem: PromptItem = {
      id: Date.now().toString(),
      content,
      sourceRequest: requestId,
      createdAt: new Date()
    };
    setPromptItems(prev => [...prev, newPromptItem]);
    setShowPromptArea(true);
  };

  // Update request content
  const updateRequestContent = (id: string, content: string) => {
    setRequests(requests.map(req =>
      req.id === id ? { ...req, content } : req
    ));
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

  return (
    <div className="flex h-full w-full relative">
      {error && (
        <Alert variant="destructive" className="absolute top-4 right-4 z-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Requirements Side Panel */}
        <RequirementsSidePanel
          requests={requests}
          selectedRequest={selectedRequest}
          onSelectRequest={setSelectedRequest}
          width={sidePanelWidth}
          onWidthChange={setSidePanelWidth}
          className="h-full"
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
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
            
            {/* Start Prompt Area Button */}
            {!showPromptArea && (
                <div className="flex justify-end p-4">
                <Button
                    onClick={() => setShowPromptArea(true)}
                    className="shadow-lg"
                >
                    Show Prompt Area
                </Button>
                </div>
            )}
        

            {/* Current Request/Response */}
            {requests.length > 0 && requests[requests.length - 1].status === ChatCardState.READY && (
              <ChatCard
                id={requests[requests.length - 1].id}
                number={requests[requests.length - 1].number}
                content={requests[requests.length - 1].content || ''}
                status={requests[requests.length - 1].status}
                chatType={ChatType.REQUIREMENTS}
                isFirst={true}
                isLast={true}
                onDelete={deleteRequest}
                onContentChange={updateRequestContent}
                onSend={() => onProcessRequests(requests[requests.length - 1].id)}
                onAttach={handleAttachment}
                onRemoveAttachment={handleRemoveAttachment}
              />
            )}

            {/* Selected Historical Request/Response */}
            {selectedRequest && (
              <RequirementsResponseCard
                request={requests.find(r => r.id === selectedRequest)!}
                onAddToPrompt={handleAddToPrompt}
              />
            )}
          </div>

          {/* New Message Area */}
          {(!requests.length || requests[requests.length - 1].status !== ChatCardState.READY) && (
            <div className="p-4 border-t w-full">
              <Button
                onClick={addNewRequest}
                className="w-full py-8 text-gray-500 hover:text-gray-700"
                variant="ghost"
              >
                Type a new message...
              </Button>
            </div>
          )}

          {/* Start Prompt Area Button */}
          {/* {!showPromptArea && (
            <div className="absolute right-4 top-4 z-10">
              <Button
                onClick={() => setShowPromptArea(true)}
                className="shadow-lg"
              >
                Show Prompt Area
              </Button>
            </div>
          )} */}
        </div> 

        {/* Prompt Area Panel */}
        {showPromptArea && (
          <RequirementsPromptArea
            items={promptItems}
            width={promptAreaWidth}
            onWidthChange={setPromptAreaWidth}
            onClose={() => setShowPromptArea(false)}
            onRemoveItem={(id) => setPromptItems(prev => prev.filter(item => item.id !== id))}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
};


export default RequirementsChat;