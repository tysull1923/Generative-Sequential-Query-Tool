// src/components/SaveSettings/SaveSettings.tsx
import React from 'react';
import { Save, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChatSettings, ChatSavingParams } from '@/utils/types/chat.types';

interface SaveSettingsProps {
  settings: ChatSettings;
  onSavingParamsChange: (params: Partial<ChatSavingParams>) => void;
}

const SaveSettings: React.FC<SaveSettingsProps> = ({
  settings,
  onSavingParamsChange,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100">
          <Save size={20} />
          <ChevronDown size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          {/* Save to Application Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="saveToApp"
              checked={settings.savingParams?.saveToApplication}
              onChange={(e) => onSavingParamsChange({ saveToApplication: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="saveToApp" className="text-sm">Save to Application</label>
          </div>

          {/* Save to File Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="saveToFile"
              checked={settings.savingParams?.saveToFile}
              onChange={(e) => onSavingParamsChange({ saveToFile: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="saveToFile" className="text-sm">Save to File</label>
          </div>

          {/* Chat Summary */}
          <div>
            <label className="block text-sm font-medium mb-1">Chat Summary</label>
            <textarea
              value={settings.savingParams?.summary || ''}
              onChange={(e) => onSavingParamsChange({ summary: e.target.value })}
              className="w-full p-2 border rounded-md h-24 resize-none"
              placeholder="Enter chat summary..."
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SaveSettings;