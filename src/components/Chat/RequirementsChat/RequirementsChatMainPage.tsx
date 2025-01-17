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

// We'll create these components next
import RequirementsPromptArea from '@/components/Chat/RequirementsChat/RequirementsPromptArea';
import RequirementsSidePanel from '@/components/Chat/RequirementsChat/RequirementsSidePanel';
import RequirementsResponseCard from '@/components/Chat/RequirementsChat/RequirementsResponseCard';

interface PromptItem {
  id: string;
  content: string;
  sourceRequest: string; // ID of the request this prompt came from
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
    setSelectedRequest(null); // Hide previous response
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

  return (
    <div className="flex h-full relative">
      {error && (
        <Alert variant="destructive" className="absolute top-4 right-4 z-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Requirements Side Panel */}
      <RequirementsSidePanel
        requests={requests}
        selectedRequest={selectedRequest}
        onSelectRequest={setSelectedRequest}
        width={sidePanelWidth}
        onWidthChange={setSidePanelWidth}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
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
              onContentChange={updateRequestContent}
              onSend={() => onProcessRequests(requests[requests.length - 1].id)}
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
          <div className="p-4 border-t">
            <Button
              onClick={addNewRequest}
              className="w-full py-8 text-gray-500 hover:text-gray-700"
              variant="ghost"
            >
              Type a new message...
            </Button>
          </div>
        )}
      </div>

      {/* Prompt Area Panel */}
      {showPromptArea && (
        <RequirementsPromptArea
          items={promptItems}
          width={promptAreaWidth}
          onWidthChange={setPromptAreaWidth}
          onClose={() => setShowPromptArea(false)}
          onRemoveItem={(id) => setPromptItems(prev => prev.filter(item => item.id !== id))}
        />
      )}

      {/* Start Prompt Area Button */}
      {!showPromptArea && (
        <Button
          className="absolute right-4 top-4"
          onClick={() => setShowPromptArea(true)}
        >
          Start Prompt Area
        </Button>
      )}
    </div>
  );
};

export default RequirementsChat;