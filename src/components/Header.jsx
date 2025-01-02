import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-gray-800 text-white py-4 px-6 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          GSQT
        </Link>
        
        <nav className="flex space-x-6">
          <Link to="/new-chat" className="hover:text-gray-300 transition-colors">
            New Chat
          </Link>
          <Link to="/recent-chats" className="hover:text-gray-300 transition-colors">
            Recent Chats
          </Link>
          <Link to="/settings" className="hover:text-gray-300 transition-colors">
            Settings
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <select className="bg-gray-700 text-white px-3 py-1 rounded-md">
            <option value="openai">OpenAI</option>
            <option value="claude">Claude</option>
          </select>
          <div className="flex items-center">
            <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
            <span className="text-sm">Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;