// src/components/ToolsMenu/ToolsMenu.tsx
import React from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChatType, ChatSettings } from '@/utils/types/chat.types';

interface ToolsMenuProps {
  settings: ChatSettings;
  onTemperatureChange: (value: string) => void;
  onChatTypeChange: (type: ChatType) => void;
  onSystemContextClick: () => void;
  hasSystemContext: boolean;
}

const ToolsMenu: React.FC<ToolsMenuProps> = ({
  settings,
  onTemperatureChange,
  onChatTypeChange,
  onSystemContextClick,
  hasSystemContext,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <Settings size={20} />
          <ChevronDown size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          {/* Temperature Setting */}
          <div>
            <label className="block text-sm font-medium mb-1">Temperature</label>
            <div className="flex items-center space-x-2">
              <input 
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => onTemperatureChange(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm text-gray-500 w-12 text-right">
                {settings.temperature}
              </span>
            </div>
          </div>

          {/* Chat Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Chat Type</label>
            <select 
              value={settings.chatType}
              onChange={(e) => onChatTypeChange(e.target.value as ChatType)}
              className="w-full p-2 border rounded-md"
            >
              <option value={ChatType.BASE}>Base Chat</option>
              <option value={ChatType.SEQUENTIAL}>Sequential Chat</option>
              <option value={ChatType.REQUIREMENTS}>Requirements Chat</option>
            </select>
          </div>

          {/* System Context Button */}
          <Button
            onClick={onSystemContextClick}
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
          >
            {hasSystemContext ? "Show System Context" : "Add System Context"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ToolsMenu;