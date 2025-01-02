// src/components/features/APIStatus.jsx
import React from 'react';
import { useAPIStatus } from '../../hooks/useAPIStatus';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const APIStatus = () => {
  const { apiStatus, updateAPIKey } = useAPIStatus();
  const [selectedAPI, setSelectedAPI] = React.useState('OpenAI');
  
  const [openaiKey, setOpenaiKey] = React.useState('');
  const [claudeKey, setClaudeKey] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const isSettingPage = location.pathname === "/settings";
  const isHomePage = location.pathname === '/';
  const isNewChatPage = location.pathname === "/new-chat";



  const handleUpdateKeys = async () => {
    setIsUpdating(true);
    try {
      if (openaiKey) {
        await updateAPIKey('openai', openaiKey);
      }
      if (claudeKey) {
        await updateAPIKey('claude', claudeKey);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      
      <div className="flex items-center space-x-6">
        <div className="flex items-center">
          <div className={`h-2 w-2 rounded-full mr-2 ${
            apiStatus.openai === 'operational' ? 'bg-green-500' : 
            apiStatus.openai === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm">OpenAI</span>
        </div>
        <div className="flex items-center">
          <div className={`h-2 w-2 rounded-full mr-2 ${
            apiStatus.claude === 'operational' ? 'bg-green-500' : 
            apiStatus.claude === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm">Claude</span>
        </div>
      </div>

     

      {isHomePage && (
        <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">OpenAI API Key</label>
              <Input
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Claude API Key</label>
              <Input
                type="password"
                placeholder="sk-ant-..."
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleUpdateKeys} 
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? 'Updating...' : 'Update API Keys'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      )}


      {isNewChatPage && (
            <div className="flex items-center space-x-4">
              <select 
                value={selectedAPI}
                onChange={(e) => setSelectedAPI(e.target.value)}
                className="bg-gray-700 rounded px-3 py-1 text-sm"
              >
                <option value="OpenAI">OpenAI</option>
                <option value="Claude">Claude</option>
              </select>
              {/* <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  apiStatus.claude === 'Operational' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm">{apiStatus.claude}</span>
              </div> */}
              
            </div>
        )}
    </div>
  );
};

export default APIStatus;