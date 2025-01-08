// src/components/Banner/ChatBanner/ChatBanner.tsx
// src/components/Banner/ChatBanner/ChatBanner.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ChatType,
  ChatSettings,
  ChatParameters,
  ChatSavingParams,
} from '@/utils/types/chat.types';
import { AlertCircle, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ToolsMenu from '@/components/features/Tools/ToolsMenu';
import SaveSettings from '@/components/features/ChatSaveSettings/ChatSaveSettingsMenu';

interface ChatBannerProps {
  chatType: ChatType;
  title: string;
  settings: ChatSettings;
  onSettingsChange: (settings: Partial<ChatSettings>) => void;
  onTitleChange: (title: string) => void;
  onSystemContextClick: () => void;
  hasSystemContext: boolean;
  onAddStep?: (stepType: 'pause' | 'delay') => void;
  className?: string;
}

const ChatBanner: React.FC<ChatBannerProps> = ({
  chatType,
  title,
  settings,
  onSettingsChange,
  onTitleChange,
  onSystemContextClick,
  hasSystemContext,
  onAddStep,
  className = ''
}) => {
  // State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Update local title when prop changes
  useEffect(() => {
    setTitleInput(title);
  }, [title]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  // Tools menu handlers
  const handleTemperatureChange = useCallback((value: string) => {
    const temp = parseFloat(value);
    if (!isNaN(temp) && temp >= 0 && temp <= 2) {
      onSettingsChange({ temperature: temp });
    }
  }, [onSettingsChange]);

  const handleChatTypeChange = useCallback((type: ChatType) => {
    onSettingsChange({ chatType: type });
  }, [onSettingsChange]);

  // Saving params handlers
  const handleSavingParamsChange = useCallback((params: Partial<ChatSavingParams>) => {
    const currentParams = settings.savingParams || {
      saveToApplication: false,
      saveToFile: false
    };
    onSettingsChange({
      savingParams: { ...currentParams, ...params }
    });
  }, [settings.savingParams, onSettingsChange]);

  // Title handlers
  const handleTitleSubmit = useCallback(() => {
    if (titleInput.trim() !== title) {
      onTitleChange(titleInput.trim());
    }
    setIsEditingTitle(false);
  }, [titleInput, title, onTitleChange]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitleInput(title);
      setIsEditingTitle(false);
    }
  }, [handleTitleSubmit, title]);

  return (
    <div className={`w-full bg-white shadow-sm border-b border-gray-200 px-4 py-2 flex items-center justify-between ${className}`}>
      {/* Left section - Tools Menu */}
      <div className="flex items-center space-x-4">
        <ToolsMenu
          settings={settings}
          onTemperatureChange={handleTemperatureChange}
          onChatTypeChange={handleChatTypeChange}
          onSystemContextClick={onSystemContextClick}
          hasSystemContext={hasSystemContext}
        />

        {/* Sequential Chat Step Options */}
        {chatType === ChatType.SEQUENTIAL && onAddStep && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100">
                <span>Add Step</span>
                <ChevronDown size={16} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <button
                onClick={() => onAddStep('pause')}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md"
              >
                Add Pause
              </button>
              <button
                onClick={() => onAddStep('delay')}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md"
              >
                Add Delay
              </button>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Middle section - Title */}
      <div
        className="flex-1 mx-4 text-center"
        onDoubleClick={() => setIsEditingTitle(true)}
      >
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyDown}
            className="w-full text-center bg-white border-b border-blue-500 focus:outline-none px-2 py-1"
          />
        ) : (
          <h1 className="text-lg font-medium truncate cursor-pointer">
            {title || 'Untitled Chat'}
          </h1>
        )}
      </div>

      {/* Right section - Save Settings */}
      <div className="flex items-center space-x-4">
        <SaveSettings
          settings={settings}
          onSavingParamsChange={handleSavingParamsChange}
        />

        {/* Error Indicator */}
        {error && (
          <div className="text-red-500 flex items-center space-x-1">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBanner;



// import React, { useState, useCallback, useRef, useEffect } from 'react';
// import {
//   ChatType,
//   ChatSettings,
//   ChatParameters,
//   ChatSavingParams,
//   SequentialStepType
// } from '@/utils/types/chat.types';
// import { Settings, ChevronDown, Save, Edit2, AlertCircle } from 'lucide-react';
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from '@/components/ui/popover';
// import { Button } from '@/components/ui/button';
// import { Plus } from 'lucide-react';



// interface ChatBannerProps {
//   chatType: ChatType;
//   title: string;
//   settings: ChatSettings;
//   onSettingsChange: (settings: Partial<ChatSettings>) => void;
//   onTitleChange: (title: string) => void;
//   onAddStep?: (stepType: 'pause' | 'delay') => void;
//   className?: string;
// }

// const ChatBanner: React.FC<ChatBannerProps> = ({
//   chatType,
//   title,
//   settings,
//   onSettingsChange,
//   onTitleChange,
//   onAddStep,
//   className = ''
// }) => {
//   // State for managing the title editing
//   const [isEditingTitle, setIsEditingTitle] = useState(false);
//   const [titleInput, setTitleInput] = useState(title);
//   const titleInputRef = useRef<HTMLInputElement>(null);

//   // State for managing loading and error states
//   const [isSaving, setIsSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [showSystemContext, setShowSystemContext] = useState<boolean>(false);
//   // Update local title when prop changes
//   useEffect(() => {
//     setTitleInput(title);
//   }, [title]);

//   // Focus input when editing starts
//   useEffect(() => {
//     if (isEditingTitle && titleInputRef.current) {
//       titleInputRef.current.focus();
//     }
//   }, [isEditingTitle]);

//   // Handler for temperature changes
//   const handleTemperatureChange = useCallback((value: string) => {
//     const temp = parseFloat(value);
//     if (!isNaN(temp) && temp >= 0 && temp <= 2) {
//       onSettingsChange({ temperature: temp });
//     }
//   }, [onSettingsChange]);

//   // Handler for chat type changes
//   const handleChatTypeChange = useCallback((type: ChatType) => {
//     onSettingsChange({ chatType: type });
//   }, [onSettingsChange]);

//   // Handler for system context changes
//   const handleSystemContextChange = useCallback((context: string) => {
//     onSettingsChange({ systemContext: context });
//   }, [onSettingsChange]);

//   // Handler for saving settings changes
//   const handleSavingParamsChange = useCallback((params: Partial<ChatSavingParams>) => {
//     const currentParams = settings.savingParams || {
//       saveToApplication: false,
//       saveToFile: false
//     };
//     onSettingsChange({
//       savingParams: { ...currentParams, ...params }
//     });
//   }, [settings.savingParams, onSettingsChange]);
// //   const handleSavingParamsChange = useCallback((params: Partial<ChatSavingParams>) => {
// //     onSettingsChange({
// //       savingParams: { ...settings.savingParams, ...params }
// //     });
// //   }, [settings.savingParams, onSettingsChange]);

//   // Handler for title changes
//   const handleTitleSubmit = useCallback(() => {
//     if (titleInput.trim() !== title) {
//       onTitleChange(titleInput.trim());
//     }
//     setIsEditingTitle(false);
//   }, [titleInput, title, onTitleChange]);

//   // Handler for title editing keyboard events
//   const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') {
//       handleTitleSubmit();
//     } else if (e.key === 'Escape') {
//       setTitleInput(title);
//       setIsEditingTitle(false);
//     }
//   }, [handleTitleSubmit, title]);

//   return (
//     <div className={`w-full bg-white shadow-sm border-b border-gray-200 px-4 py-2 flex items-center justify-between ${className}`}>
//       {/* Left section - Chat Settings */}
//       <div className="flex items-center space-x-4">
//         <Popover>
//           <PopoverTrigger asChild>
//             <button className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
//               <Settings size={20} />
//               <ChevronDown size={16} />
//             </button>
//           </PopoverTrigger>
//           <PopoverContent className="w-80 p-4">
//             <div className="space-y-4">
//               {/* Temperature Setting */}
//               <div>
//                 <label className="block text-sm font-medium mb-1">Temperature</label>
//                 <input 
//                   type="range"
//                   min="0"
//                   max="2"
//                   step="0.1"
//                   value={settings.temperature}
//                   onChange={(e) => handleTemperatureChange(e.target.value)}
//                   className="w-full"
//                 />
//                 <span className="text-sm text-gray-500">{settings.temperature}</span>
//               </div>

//               {/* Chat Type Selection */}
//               <div>
//                 <label className="block text-sm font-medium mb-1">Chat Type</label>
//                 <select 
//                   value={settings.chatType}
//                   onChange={(e) => handleChatTypeChange(e.target.value as ChatType)}
//                   className="w-full p-2 border rounded-md"
//                 >
//                   <option value={ChatType.BASE}>Base Chat</option>
//                   <option value={ChatType.SEQUENTIAL}>Sequential Chat</option>
//                   <option value={ChatType.REQUIREMENTS}>Requirements Chat</option>
//                 </select>
//               </div>

//               {/* System Context */}
//               {/* System Context */}
//               {!showSystemContext && (
//                 <Button
//                   onClick={() => setShowSystemContext(true)}
//                   className="w-full flex items-center justify-center gap-2 mb-4"
//                   variant="outline"
//                 >
//                   <Plus className="h-4 w-4" />
//                   Add System Context
//                 </Button>
//               )}
//               {/* <div>
//                 <label className="block text-sm font-medium mb-1">System Context</label>
//                 <textarea
//                   value={settings.systemContext || ''}
//                   onChange={(e) => handleSystemContextChange(e.target.value)}
//                   className="w-full p-2 border rounded-md h-24 resize-none"
//                   placeholder="Enter system context..."
//                 />
//               </div> */}
//             </div> 
//           </PopoverContent>
//         </Popover>

//         {/* Sequential Chat Step Options */}
//         {chatType === ChatType.SEQUENTIAL && onAddStep && (
//           <Popover>
//             <PopoverTrigger asChild>
//               <button className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100">
//                 <span>Add Step</span>
//                 <ChevronDown size={16} />
//               </button>
//             </PopoverTrigger>
//             <PopoverContent className="w-48 p-2">
//               <button
//                 onClick={() => onAddStep('pause')}
//                 className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md"
//               >
//                 Add Pause
//               </button>
//               <button
//                 onClick={() => onAddStep('delay')}
//                 className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md"
//               >
//                 Add Delay
//               </button>
//             </PopoverContent>
//           </Popover>
//         )}
//       </div>

//       {/* Middle section - Title */}
//       <div
//         className="flex-1 mx-4 text-center"
//         onDoubleClick={() => setIsEditingTitle(true)}
//       >
//         {isEditingTitle ? (
//           <input
//             ref={titleInputRef}
//             type="text"
//             value={titleInput}
//             onChange={(e) => setTitleInput(e.target.value)}
//             onBlur={handleTitleSubmit}
//             onKeyDown={handleTitleKeyDown}
//             className="w-full text-center bg-white border-b border-blue-500 focus:outline-none px-2 py-1"
//           />
//         ) : (
//           <h1 className="text-lg font-medium truncate cursor-pointer">
//             {title || 'Untitled Chat'}
//           </h1>
//         )}
//       </div>

//       {/* Right section - Save Settings */}
//       <div className="flex items-center space-x-4">
//         <Popover>
//           <PopoverTrigger asChild>
//             <button className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100">
//               <Save size={20} />
//               <ChevronDown size={16} />
//             </button>
//           </PopoverTrigger>
//           <PopoverContent className="w-80 p-4">
//             <div className="space-y-4">
//               <div className="flex items-center space-x-2">
//                 <input
//                   type="checkbox"
//                   id="saveToApp"
//                   checked={settings.savingParams?.saveToApplication}
//                   onChange={(e) => handleSavingParamsChange({ saveToApplication: e.target.checked })}
//                   className="rounded border-gray-300"
//                 />
//                 <label htmlFor="saveToApp" className="text-sm">Save to Application</label>
//               </div>

//               <div className="flex items-center space-x-2">
//                 <input
//                   type="checkbox"
//                   id="saveToFile"
//                   checked={settings.savingParams?.saveToFile}
//                   onChange={(e) => handleSavingParamsChange({ saveToFile: e.target.checked })}
//                   className="rounded border-gray-300"
//                 />
//                 <label htmlFor="saveToFile" className="text-sm">Save to File</label>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Chat Summary</label>
//                 <textarea
//                   value={settings.savingParams?.summary || ''}
//                   onChange={(e) => handleSavingParamsChange({ summary: e.target.value })}
//                   className="w-full p-2 border rounded-md h-24 resize-none"
//                   placeholder="Enter chat summary..."
//                 />
//               </div>
//             </div>
//           </PopoverContent>
//         </Popover>

//         {/* Error Indicator */}
//         {error && (
//           <div className="text-red-500 flex items-center space-x-1">
//             <AlertCircle size={16} />
//             <span className="text-sm">{error}</span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChatBanner;