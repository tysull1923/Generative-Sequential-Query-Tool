import React, { useCallback, useRef, useState, useEffect } from 'react';
import { GripVertical, X, Copy, Check, ArrowUp, ArrowDown, ListPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { PromptItem } from '@/utils/types/chat.types';

interface PromptCardProps {
  item: PromptItem;
  index: number;
  isLast: boolean;
  onCopy: (id: string, content: string) => void;
  onRemove: (id: string) => void;
  onMove?: (id: string, direction: 'up' | 'down') => void;
  copySuccess: string | null;
}

const PromptCard: React.FC<PromptCardProps> = ({
  item,
  index,
  isLast,
  onCopy,
  onRemove,
  onMove,
  copySuccess
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxPreviewLength = 100; // Adjust this value to change preview length
  const needsExpansion = item.content.length > maxPreviewLength;

  const previewContent = needsExpansion && !isExpanded
    ? `${item.content.slice(0, maxPreviewLength)}...`
    : item.content;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  return (
    <Card className="relative group">
      <CardContent className="p-4">
        {/* Prompt Content */}
        <div className="mb-2">
          <div className="whitespace-pre-wrap">
            {previewContent}
          </div>
          {needsExpansion && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-6 text-xs text-gray-500 hover:text-gray-700"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <><ChevronUp className="h-3 w-3 mr-1" /> Show Less</>
              ) : (
                <><ChevronDown className="h-3 w-3 mr-1" /> Show More</>
              )}
            </Button>
          )}
        </div>

        {/* Metadata and Actions */}
        <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
          <span>{formatDate(item.createdAt)}</span>
          <div className="flex items-center gap-2">
            {/* Move Actions */}
            {onMove && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={index === 0}
                  onClick={() => onMove(item.id, 'up')}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isLast}
                  onClick={() => onMove(item.id, 'down')}
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
              onClick={() => onCopy(item.id, item.content)}
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
              onClick={() => onRemove(item.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptCard;