import React, { useCallback, useRef, useState, useEffect } from 'react';
import { GripVertical, X, Copy, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface PromptItem {
  id: string;
  content: string;
  sourceRequest: string;
  createdAt: Date;
}

interface RequirementsPromptAreaProps {
  items: PromptItem[];
  width: number;
  onWidthChange: (width: number) => void;
  onClose: () => void;
  onRemoveItem: (id: string) => void;
  onMoveItem?: (id: string, direction: 'up' | 'down') => void;
  className?: string;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 800;

const RequirementsPromptArea: React.FC<RequirementsPromptAreaProps> = ({
  items,
  width,
  onWidthChange,
  onClose,
  onRemoveItem,
  onMoveItem,
  className = ''
}) => {
  // State
  const [isResizing, setIsResizing] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  
  // Refs
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  
  // Toast
  const { toast } = useToast();

  // Handle mouse movement during resize
  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !panelRef.current) return;

    const panelRect = panelRef.current.getBoundingClientRect();
    const newWidth = panelRect.right - e.clientX;
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

  // Copy prompt content
  const handleCopy = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(id);
      setTimeout(() => setCopySuccess(null), 2000);
      toast({
        title: "Copied to clipboard",
        duration: 2000
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
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

  return (
    <div 
      ref={panelRef}
      className={cn(
        "flex-shrink-0 bg-background border-l relative",
        className
      )}
      style={{ width }}
    >
      {/* Resize Handle */}
      <div
        ref={resizeHandleRef}
        className="absolute left-0 top-0 h-full w-1 cursor-ew-resize group"
        onMouseDown={handleResizeStart}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center bg-background border rounded opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">Prompt Area</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Prompt List */}
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="p-4 space-y-4">
          {items.map((item, index) => (
            <Card key={item.id} className="relative group">
              <CardContent className="p-4">
                {/* Prompt Content */}
                <div className="mb-2 whitespace-pre-wrap">
                  {item.content}
                </div>

                {/* Metadata and Actions */}
                <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                  <span>{formatDate(item.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    {/* Move Actions */}
                    {onMoveItem && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={index === 0}
                          onClick={() => onMoveItem(item.id, 'up')}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={index === items.length - 1}
                          onClick={() => onMoveItem(item.id, 'down')}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {/* Copy Action */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopy(item.id, item.content)}
                    >
                      {copySuccess === item.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Remove Action */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {items.length === 0 && (
            <div className="text-center text-gray-500 p-4">
              No prompts added yet. Click "Add to Prompt Area" in any response to collect prompts.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RequirementsPromptArea;