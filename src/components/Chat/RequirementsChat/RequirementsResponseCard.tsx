import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ResponsePanel from '@/components/features/Responses/ResponsePanel';
import { 
  ChatRequest,
  ChatResponse,
  ChatDocument
} from '@/utils/types/chat.types';

interface RequirementsResponseCardProps {
  request: ChatRequest;
  onAddToPrompt: (requestId: string, content: string) => void;
  onSave?: (chat: ChatDocument) => void;
  className?: string;
}

const RequirementsResponseCard: React.FC<RequirementsResponseCardProps> = ({
  request,
  onAddToPrompt,
  onSave,
  className = ''
}) => {
  // Handle saving response
  const handleSaveResponse = (id: string) => {
    if (onSave && request.response) {
      onSave({
        id,
        title: `Requirement Response ${request.number}`,
        type: request.type,
        messages: [],
        responses: [request.response],
        settings: {
          temperature: 0.7,
          chatType: request.type
        },
        executionStatus: 'completed',
        lastModified: new Date(),
        createdAt: new Date()
      });
    }
  };

  // Custom toolbar component to add the "Add to Prompt" button
  const CustomToolbar = () => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => {
          if (request.response?.content) {
            onAddToPrompt(request.id, request.response.content.toString());
          }
        }}
      >
        <Plus className="h-4 w-4" />
        Add to Prompt Area
      </Button>
    </div>
  );

  return (
    <div className={className}>
      <ResponsePanel
        selectedRequestId={request.id}
        requests={[request]}
        onSaveResponse={handleSaveResponse}
        toolbarContent={<CustomToolbar />}
      />
    </div>
  );
};

export default RequirementsResponseCard;