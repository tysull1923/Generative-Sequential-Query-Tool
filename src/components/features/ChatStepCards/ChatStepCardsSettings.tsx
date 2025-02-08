// src/components/SequentialSteps/SequentialStepsMenu.tsx
// src/components/features/ChatStepCards/ChatStepCardSettings.tsx
import React from 'react';
import { ChevronDown, Pause, Clock } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SequentialStepType } from '@/utils/types/chat.types';

interface ChatStepCardSettingsProps {
  onAddStep: (stepType: SequentialStepType.PAUSE | SequentialStepType.DELAY) => void;
  className?: string;
}

const ChatStepCardSettings: React.FC<ChatStepCardSettingsProps> = ({
  onAddStep,
  className = ''
}) => {
  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
          >
            <span>Add Step</span>
            <ChevronDown size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            {/* Pause Step */}
            <button
              onClick={() => onAddStep(SequentialStepType.PAUSE)}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Pause className="h-4 w-4" />
              <span>Add Pause Step</span>
            </button>

            {/* Delay Step */}
            <button
              onClick={() => onAddStep(SequentialStepType.DELAY)}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Clock className="h-4 w-4" />
              <span>Add Delay Step</span>
            </button>
          </div>

          {/* Description */}
          <div className="mt-2 px-3 py-2 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600">
              Pause steps wait for manual continuation.
              Delay steps wait for a specified time.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ChatStepCardSettings;