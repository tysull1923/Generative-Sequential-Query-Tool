import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, MessageSquarePlus, History, Plus } from 'lucide-react';
import APIStatus from '../components/features/APIStatus';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HomePage = () => {
  const chatHistory = [
    { id: 1, title: "Product Analysis", date: "2025-01-01", queries: 5 },
    { id: 2, title: "Market Research", date: "2025-01-01", queries: 3 },
    { id: 3, title: "Content Generation", date: "2024-12-31", queries: 7 }
  ];

  const apiStatus = {
    openai: "operational",
    claude: "operational"
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Banner */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold">GSQT</h1>
            
            <nav className="flex space-x-4">
              <Button variant="ghost" className="flex items-center">
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
              <Button variant="ghost" className="flex items-center">
                <History className="mr-2 h-4 w-4" />
                Recent Chats
              </Button>
              <Button variant="ghost" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-4">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select API" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            
            
            <APIStatus />
          </div>
          

          <Button className="flex items-center" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatHistory.map((chat) => (
            <Card key={chat.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{chat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{chat.date}</span>
                  <span>{chat.queries} queries</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HomePage;