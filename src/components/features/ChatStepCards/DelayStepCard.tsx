// src/components/features/ChatStepCards/DelayStepCard.tsx
import React, { useState, useCallback } from 'react';
import { Clock, Trash2, ArrowUpDown, Edit2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DelayStepCardProps {
  id: string;
  duration: number;
  number: number;
  onDurationChange: (id: string, duration: number) => void;
  onDelete: (id: string) => void;
  onMove?: (id: string, direction: 'up' | 'down') => void;
  isFirst?: boolean;
  isLast?: boolean;
  className?: string;
}

const MIN_DURATION = 1;
const MAX_DURATION = 300; // 5 minutes max delay

const DelayStepCard: React.FC<DelayStepCardProps> = ({
  id,
  duration,
  number,
  onDurationChange,
  onDelete,
  onMove,
  isFirst = false,
  isLast = false,
  className = ''
}) => {
  // State
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(duration.toString());
  const [error, setError] = useState<string | null>(null);

  // Handlers
  const handleDurationSubmit = useCallback(() => {
    const newDuration = parseInt(inputValue);
    
    if (isNaN(newDuration)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (newDuration < MIN_DURATION) {
      setError(`Minimum duration is ${MIN_DURATION} second`);
      return;
    }
    
    if (newDuration > MAX_DURATION) {
      setError(`Maximum duration is ${MAX_DURATION} seconds`);
      return;
    }

    setError(null);
    onDurationChange(id, newDuration);
    setIsEditing(false);
  }, [id, inputValue, onDurationChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleDurationSubmit();
    } else if (e.key === 'Escape') {
      setInputValue(duration.toString());
      setIsEditing(false);
      setError(null);
    }
  }, [duration, handleDurationSubmit]);

  const handleBlur = useCallback(() => {
    if (isEditing) {
      handleDurationSubmit();
    }
  }, [isEditing, handleDurationSubmit]);

  return (
    <Card className={`relative ${className}`}>
      {/* Move controls */}
      {onMove && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove(id, 'up')}
            disabled={isFirst}
            className="h-6 w-6"
            aria-label="Move up"
          >
            <ArrowUpDown className="h-4 w-4 rotate-180" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove(id, 'down')}
            disabled={isLast}
            className="h-6 w-6"
            aria-label="Move down"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="p-4 pl-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-gray-500" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">Delay Step #{number}</span>
              {error && <span className="text-sm text-red-500">{error}</span>}
            </div>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className="w-20 h-8"
                    min={MIN_DURATION}
                    max={MAX_DURATION}
                    autoFocus
                  />
                  <span className="text-sm text-gray-500">seconds</span>
                </div>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span 
                        className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                        onClick={() => setIsEditing(true)}
                      >
                        {duration} {duration === 1 ? 'second' : 'seconds'}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to edit duration</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(id)}
          className="h-8 w-8 text-gray-500 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default DelayStepCard;