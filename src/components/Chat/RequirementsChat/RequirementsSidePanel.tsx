import React, { useCallback, useRef, useState, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ChatCard from '@/components/features/ChatCards/ChatCard';
import {
  ChatRequest,
  ChatType,
  ChatCardState
} from '@/utils/types/chat.types';

interface RequirementsSidePanelProps {
  requests: ChatRequest[];
  selectedRequest: string | null;
  onSelectRequest: (id: string | null) => void;
  width: number;
  onWidthChange: (width: number) => void;
  className?: string;
}

const MIN_WIDTH = 250;
const MAX_WIDTH = 600;

const RequirementsSidePanel: React.FC<RequirementsSidePanelProps> = ({
  requests,
  selectedRequest,
  onSelectRequest,
  width,
  onWidthChange,
  className = ''
}) => {
  // State for resize handling
  const [isResizing, setIsResizing] = useState(false);
  
  // Refs
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Handle mouse movement during resize
  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !panelRef.current) return;

    const newWidth = e.clientX;
    const constrainedWidth = Math.max(
      MIN_WIDTH,
      Math.min(MAX_WIDTH, newWidth)
    );

    onWidthChange(constrainedWidth);
  }, [isResizing, onWidthChange]);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  // Handle resize end
  const handleResizeEnd = () => {
    setIsResizing(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  // Set up resize event listeners
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

  // Dummy handlers for ChatCard props that won't be used in the side panel
  const noopHandler = () => {};
  
  return (
    <div 
      ref={panelRef}
      className={cn(
        "flex-shrink-0 bg-background border-r relative",
        className
      )}
      style={{ width }}
    >
      {/* Panel Content */}
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <h2 className="font-semibold text-lg mb-4">History</h2>
          
          {/* Request List */}
          <div className="space-y-2">
            {requests
              .filter(req => req.status === ChatCardState.COMPLETE)
              .map((request, index, filteredRequests) => (
                <div
                  key={request.id}
                  className={cn(
                    "transition-colors",
                    selectedRequest === request.id && "bg-accent"
                  )}
                  onClick={() => onSelectRequest(request.id)}
                >
                  <ChatCard
                    id={request.id}
                    number={request.number}
                    content={request.content}
                    status={ChatCardState.COMPLETE}
                    chatType={ChatType.REQUIREMENTS}
                    isFirst={index === 0}
                    isLast={index === filteredRequests.length - 1}
                    onMove={noopHandler}
                    onDelete={noopHandler}
                    onContentChange={noopHandler}
                    isEditable={false}
                  />
                </div>
              ))}
          </div>
        </div>
      </ScrollArea>

      {/* Resize Handle */}
      <div
        ref={resizeHandleRef}
        className="absolute right-0 top-0 h-full w-1 cursor-ew-resize group"
        onMouseDown={handleResizeStart}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center bg-background border rounded opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default RequirementsSidePanel;