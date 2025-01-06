import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from '@/components/shared/Dropdown';
import { Button } from '@/components/shared/Button';
import { Menu } from 'lucide-react';
import { ChatType } from '@/utils/types/chat.types';
import { MainBannerProps } from '@/pages/Home/HomePage.types';
import NewChatDropdown from './NewChatDropDown';

/**
 * MainBanner Component
 * - Renders dropdown menus for New, Manage Chats, and Dashboards.
 * - Allows navigation and triggering of various actions via dropdown options.
 *
 * Props:
 * - onNewChat: Function to handle new chat creation.
 * - onManageChats: Function to manage existing chats.
 * - onOpenSettings: Function to open settings.
 * - className: Optional CSS class for styling.
 */
const MainBanner: React.FC<MainBannerProps> = ({
  onNewChat,
  onManageChats,
  onOpenSettings,
  className = '',
}) => {
  const navigate = useNavigate();

  // State for managing dropdown visibility
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);
  const [isDashboardMenuOpen, setIsDashboardMenuOpen] = useState(false);

  // Handlers for dropdown actions
  const handleNewChat = useCallback(
    (type: ChatType) => {
      setIsNewMenuOpen(false);
      onNewChat(type);
    },
    [onNewChat]
  );

  const handleManageChats = useCallback(
    (type: ChatType) => {
      setIsManageMenuOpen(false);
      onManageChats(type);
    },
    [onManageChats]
  );

  const handleDashboardNavigation = useCallback(
    (path: string) => {
      setIsDashboardMenuOpen(false);
      navigate(path);
    },
    [navigate]
  );

  return (
    <div className={`w-full bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="bg-gray-800 text-white py-4 px-6 shadow-lg">
        <div className="flex items-center justify-between h-16">
          {/* Left section with dropdowns */}
          
          <div className="flex items-center space-x-4">
            {/* New Dropdown */}
            <NewChatDropdown 
            onNewChat= {handleNewChat}/>
            {/* <div className="relative">
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
                  {
                    label: 'New Chat',
                    items: [
                      { label: 'Base Chat', onClick: () => handleNewChat(ChatType.BASE) },
                      { label: 'Sequential Chat', onClick: () => handleNewChat(ChatType.SEQUENTIAL) },
                      { label: 'Requirements Chat', onClick: () => handleNewChat(ChatType.REQUIREMENTS) },
                    ],
                  },
                  { label: 'New Workflow', onClick: () => handleNewChat(ChatType.WORKFLOW) },
                  { label: 'New Scheduler', onClick: () => handleNewChat(ChatType.SCHEDULER) },
                  { label: 'More', onClick: () => navigate('/chat-types') },
                ]}
              />
            </div>  */}

            {/* Manage Chats Dropdown */}
            <div className="relative">
              <Dropdown
                trigger={
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                    aria-expanded={isManageMenuOpen}
                    onClick={() => setIsManageMenuOpen((prev) => !prev)}
                  >
                    <span>Manage Chats</span>
                  </Button>
                }
                isOpen={isManageMenuOpen}
                onOpenChange={setIsManageMenuOpen}
                placement="bottom"
                items={[
                  { label: 'Base Chats', onClick: () => handleManageChats(ChatType.BASE) },
                  { label: 'Sequential Chats', onClick: () => handleManageChats(ChatType.SEQUENTIAL) },
                  { label: 'Requirements Chats', onClick: () => handleManageChats(ChatType.REQUIREMENTS) },
                  { label: 'Workflows', onClick: () => handleManageChats(ChatType.WORKFLOW) },
                  { label: 'Schedulers', onClick: () => handleManageChats(ChatType.SCHEDULER) },
                  { label: 'Manage All', onClick: () => navigate('/manage/all') },
                ]}
              />
            </div>

            {/* Dashboards Dropdown */}
            <div className="relative">
              <Dropdown
                trigger={
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                    aria-expanded={isDashboardMenuOpen}
                    onClick={() => setIsDashboardMenuOpen((prev) => !prev)}
                  >
                    <span>Dashboards</span>
                  </Button>
                }
                isOpen={isDashboardMenuOpen}
                onOpenChange={setIsDashboardMenuOpen}
                placement="bottom"
                items={[
                  { label: 'Workflow Dashboard', onClick: () => handleDashboardNavigation('/dashboards/workflow') },
                  { label: 'Scheduler Dashboard', onClick: () => handleDashboardNavigation('/dashboards/scheduler') },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainBanner;
