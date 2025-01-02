import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Settings, Plus, History, MessageSquare } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  apiType: 'OpenAI' | 'Claude';
}

const HomePage = () => {
  // Sample chat histories
  const chatHistories: ChatHistory[] = [
    {
      id: '1',
      title: 'Project Analysis Discussion',
      date: '2025-01-01',
      apiType: 'OpenAI'
    },
    {
      id: '2',
      title: 'Code Review Session',
      date: '2025-01-01',
      apiType: 'Claude'
    }
  ];

  const [apiStatus, setApiStatus] = React.useState({
    openai: false,
    claude: false
  });

  const [selectedModel, setSelectedModel] = React.useState('');

  const models = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'claude', label: 'Claude' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">GSQT</h1>
            <div className="flex items-center gap-6">
              {/* API Status Indicators */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${apiStatus.openai ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>OpenAI</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${apiStatus.claude ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>Claude</span>
                </div>
              </div>
              {/* Model Selector */}
              <Select onValueChange={setSelectedModel} value={selectedModel}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" disabled>Select Model</SelectItem>
                  {models.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Navigation */}
              <nav className="flex items-center space-x-4">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  New Chat
                </Button>
                <Button variant="ghost" className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Chats
                </Button>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* Chat Histories */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* New Chat Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="flex items-center justify-center p-6">
                <Button variant="ghost" className="flex flex-col items-center gap-2 h-auto py-8">
                  <Plus className="h-10 w-10" />
                  <span className="text-lg">Start New Chat</span>
                </Button>
              </CardContent>
            </Card>

            {/* Existing Chat History Cards */}
            {chatHistories.map((chat) => (
              <Card key={chat.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{chat.title}</h3>
                      <p className="text-sm text-muted-foreground">{chat.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">{chat.apiType}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;