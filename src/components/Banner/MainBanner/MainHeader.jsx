// src/components/layout/Header.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquarePlus, History } from 'lucide-react';
import APIStatus from '@/components/features/API/GetAPIStatus';
import { useState } from 'react';
import MainBanner from './MainBanner';
import NewChatDropdown from './NewChatDropDown';
//import MainBanner from './MainBanner';


const Header = () => {
  const [selectedAPI, setSelectedAPI] = useState('OpenAI');
  //const [apiStatus, setApiStatus] = useState('Connected');
 // const apiStatus = useApiConnection(selectedAPI);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isSettingPage = location.pathname === "/settings";
  const isNewChatPage = location.pathname === "/new-chat";
  return (
    // 
    <header className="bg-gray-800 text-white py-4 px-6 shadow-lg">

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold hover:text-primary/90 transition-colors">
            GSQT
          </Link>
          {/* <MainBanner /> */}
            <MainBanner />
          
          {/* <nav className="flex items-center space-x-2">
            <Button
              variant="ghost"
              className="flex items-center"
              asChild
            >
              <Link to="/new-chat">
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                New Chat
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="flex items-center"
              asChild
            >
              <Link to="/">
                <History className="mr-2 h-4 w-4" />
                Recent Chats
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="flex items-center"
              asChild
            >
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>
          </nav> */}



          {/* API Status and Selection (only show on home page) */}
          <APIStatus />
          {/* {isHomePage && (
            <div className="flex items-center space-x-4">
              <APIStatus />
            </div>
          )}
          {isSettingPage && (
            <div className="flex items-center space-x-4">
              <APIStatus />
            </div>
          )}
          {isNewChatPage && (
            <div className="flex items-center space-x-4">
              <APIStatus />
            </div>
          )} */}
        </div>
      </div> 
    </header>
  );
};

export default Header;