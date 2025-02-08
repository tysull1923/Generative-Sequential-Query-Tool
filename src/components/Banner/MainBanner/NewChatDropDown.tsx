import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Dropdown from '@/components/shared/Dropdown';
import { Button } from '@/components/shared/Button';
import { Menu } from 'lucide-react';
import { ChatType } from '@/pages/Home/HomePage.types';

/**
 * NewChatDropdown Component
 * - Handles the dropdown menu for creating new chats.
 */
const NewChatDropdown: React.FC<{ onNewChat: (type: ChatType) => void }> = ({ onNewChat }) => {
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const navigate = useNavigate();
  //const menuItems = 

  const handleNewChat = useCallback(
    (type: ChatType) => {
      console.log('Selected Chat Type:', type);
      setIsNewMenuOpen(false);
      // Navigate to chat page with the selected type
      navigate('/chat', { state: { selectedChatType: type } });
    },
    [navigate]
  );
  // const handleNewChat = useCallback(
  //   (type: ChatType) => {
  //     console.log('Selected Chat Type:', type); // Debug log
  //     setIsNewMenuOpen(false);
  //     onNewChat(type);
  //   },
  //   [onNewChat]
  // );
  
  return (
    <div className="relative">
        <Dropdown
        trigger={
            <Button
            variant="ghost"
            className="flex items-center space-x-2"
            aria-expanded={isNewMenuOpen}
            onClick={() => setIsNewMenuOpen((prev) => !prev)}
            >
            <Menu className="h-5 w-5 text-white" />
            <span>New</span>
            </Button>
        }
        isOpen={isNewMenuOpen}
        onOpenChange={setIsNewMenuOpen}
        placement="bottom"
        items={[
            { label: 'Base Chat', onClick: () => handleNewChat(ChatType.BASE) },
            { label: 'Sequential Chat', onClick: () => handleNewChat(ChatType.SEQUENTIAL) },
            { label: 'Requirements Chat', onClick: () => handleNewChat(ChatType.REQUIREMENTS) },
            // {
            // label: 'New Chat',
            // items: [
            //     { label: 'Base Chat', onClick: () => handleNewChat(ChatType.BASE) },
            //     { label: 'Sequential Chat', onClick: () => handleNewChat(ChatType.SEQUENTIAL) },
            //     { label: 'Requirements Chat', onClick: () => handleNewChat(ChatType.REQUIREMENTS) },
            // ],
            // }, { label: 'New Workflow', onClick: () => handleNewChat(ChatType.WORKFLOW) },
            // { label: 'New Scheduler', onClick: () => handleNewChat(ChatType.SCHEDULER) },
            // { label: 'More', onClick: () => navigate('/chat-types') },
        ]}
        />
    </div> 
  );
};

export default NewChatDropdown;
