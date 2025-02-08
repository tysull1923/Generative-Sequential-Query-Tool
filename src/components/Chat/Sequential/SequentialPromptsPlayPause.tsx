import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Play, Pause, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SequentialPromptsBannerProps {
    onAddStep: (type: string) => void;
    onPause: () => void;
    onPlay: (delay: number) => void;
    isPlaying: boolean;
  }


const SequentialPromptsPlayPause = ({ onAddStep, onPause, onPlay, isPlaying }: SequentialPromptsBannerProps) => {
  const [delay, setDelay] = useState(0);
  const handlePlay = () => {
    onPlay(delay);
    //isPlaying = true;
  };
  return (
    <div className="bg-gray-100 border-b py-2 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Tools Section
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Tools
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <div className="flex flex-col w-full">
                <span>Delay between chats (seconds)</span>
                <input 
                  type="number" 
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  className="mt-1 p-1 border rounded"
                  min="0"
                />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}

        {/* Play/Pause Controls */}
        <div className="flex gap-2">
          <Button 
            variant="outline"
            //onClick={() => onPlay(delay)}
            onClick={handlePlay}
            disabled={isPlaying}
            className={`${isPlaying ? 'bg-green-200 text-green-700' : ''}`}
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline"
            onClick={onPause}
            disabled={!isPlaying}
          >
            <Pause className="h-4 w-4" />
          </Button>
        </div>

        {/* Add Step Menu */}
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Step
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => onAddStep('custom')}>
              Custom Step
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddStep('transform')}>
              Transform Data
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddStep('verify')}>
              Verification Step
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>
    </div>
  );
};

export default SequentialPromptsPlayPause;