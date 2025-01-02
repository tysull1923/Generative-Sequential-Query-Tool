import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, MessageSquarePlus, History } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const [selectedAPI, setSelectedAPI] = useState('OpenAI');
  const [apiStatus, setApiStatus] = useState('Connected');

  return (
    <header className="bg-gray-800 text-white py-4 px-6 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo/Title */}
        <div className="text-2xl font-bold">
          GSQT
        </div>
        
            <nav className="flex space-x-4">
              <Button onClick={() => navigate('/chat')} variant="ghost" className="flex items-center">
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
              <Button variant="ghost" className="flex items-center">
                <History className="mr-2 h-4 w-4" />
                Recent Chats
              </Button>
              <Button onClick={() => navigate('/SettingsPage')} variant="ghost" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </nav>
          
        {/* Navigation */}
        {/* <nav className="flex space-x-6">
          <Link to="/new-chat" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <MessageSquarePlus size={20} />
            <span>New Chat</span>
          </Link>
          <Link to="/recent-chats" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <History size={20} />
            <span>Recent Chats</span>
          </Link>
          <Link to="/settings" className="flex items-center space-x-2 hover:text-blue-400 transition-colors">
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav> */}

        {/* API Controls */}
        <div className="flex items-center space-x-4">
          <select 
            value={selectedAPI}
            onChange={(e) => setSelectedAPI(e.target.value)}
            className="bg-gray-700 rounded px-3 py-1 text-sm"
          >
            <option value="OpenAI">OpenAI</option>
            <option value="Claude">Claude</option>
          </select>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm">{apiStatus}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;