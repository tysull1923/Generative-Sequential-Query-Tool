// src/components/SequentialSteps/SequentialStepsMenu.tsx
import React from 'react';
import { ChevronDown, Pause, Clock } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
//import { Separator } from '@/components/ui/separator';

interface SequentialStepsMenuProps {
  onAddStep: (stepType: 'pause' | 'delay') => void;
  className?: string;
}

const SequentialStepsMenu: React.FC<SequentialStepsMenuProps> = ({
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
              onClick={() => onAddStep('pause')}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Pause className="h-4 w-4" />
              <span>Add Pause Step</span>
            </button>

            {/* Delay Step */}
            <button
              onClick={() => onAddStep('delay')}
              className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Clock className="h-4 w-4" />
              <span>Add Delay Step</span>
            </button>
          </div>

          {/* Description */}
          {/* <Separator className="my-2" /> */}
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Pause steps wait for manual continuation.
              Delay steps wait for a specified time.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SequentialStepsMenu;