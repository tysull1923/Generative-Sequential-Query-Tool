// src/components/layout/Header.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquarePlus, History } from 'lucide-react';
import APIStatus from '../features/APIStatus';

const Header = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold hover:text-primary/90 transition-colors">
            GSQT
          </Link>
          
          {/* API Status and Selection (only show on home page) */}
          {isHomePage && (
            <div className="flex items-center space-x-4">
              <APIStatus />
            </div>
          )}

          {/* Navigation */}
          <nav className="flex items-center space-x-2">
            <Button
              variant="ghost"
              className="flex items-center"
              asChild
            >
              <Link to="/chat">
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
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;