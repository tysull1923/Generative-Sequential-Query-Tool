import React, { useState,useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquarePlus, History } from 'lucide-react';
import APIStatus from '@/components/features/API/GetAPIStatus';
import MainBanner from './MainBanner';
import NewChatDropdown from './NewChatDropDown';
import { MainHeaderProps, APIType } from './MainHeader.types';
import { ChatType } from '@/utils/types/chat.types';

const MainHeader: React.FC<MainHeaderProps> = ({ className = '' }) => {
  // const isHomePage = location.pathname === '/';
  // const isSettingPage = location.pathname === "/settings";
  // const isNewChatPage = location.pathname === "/new-chat";
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [ newChatType, onNewChat] = useState<ChatType>(ChatType.BASE);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNewChat = useCallback((type: ChatType) => {
    switch (type) {
      case ChatType.BASE:
        navigate('/chat');
        break;
      case ChatType.SEQUENTIAL:
        navigate('/chat');
        break;
      case ChatType.REQUIREMENTS:
        navigate('/chat');
        break;
      // case ChatType.WORKFLOW:
      //   navigate('/workflow/new');
      //   break;
      // case ChatType.SCHEDULER:
      //   navigate('/scheduler/new');
      //   break;
    }
  }, [navigate]);

  const handleManageChats = useCallback((type: ChatType) => {
    switch (type) {
      case ChatType.BASE:
        navigate('/manage/base');
        break;
      case ChatType.SEQUENTIAL:
        navigate('/manage/sequential');
        break;
      case ChatType.REQUIREMENTS:
        navigate('/manage/requirements');
        break;
      // case ChatType.WORKFLOW:
      //   navigate('/manage/workflow');
      //   break;
      // case ChatType.SCHEDULER:
      //   navigate('/manage/scheduler');
      //   break;
    }
  }, [navigate]);

  const handleOpenSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);


  return (
    <header className={`bg-gray-800 text-white py-4 px-6 shadow-lg ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-2xl font-bold hover:text-primary/90 transition-colors"
          >
            GSQT
          </Link>

          {/* Main Banner */}
          <MainBanner
            onNewChat={handleNewChat}
            onManageChats={handleManageChats}
            onOpenSettings={handleOpenSettings}
          />

          {/* API Status */}
          <APIStatus 
          />
        </div>
      </div>
    </header>
  );
};

export default MainHeader;