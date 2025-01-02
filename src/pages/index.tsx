import React from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Settings, Plus, History, MessageSquare } from 'lucide-react';
import '../styles/globals.css';

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
    openai: 'operational',
    claude: 'operational'
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">GSQT</h1>
            <nav className="flex items-center space-x-4">
              <Button variant="ghost" className="flex items-center gap-2">
                <Plus size={20} />
                New Chat
              </Button>
              <Button variant="ghost" className="flex items-center gap-2">
                <History size={20} />
                Recent Chats
              </Button>
              <Button variant="ghost" className="flex items-center gap-2">
                <Settings size={20} />
                Settings
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* API Status Section */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">API Status</h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${apiStatus.openai === 'operational' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>OpenAI API: {apiStatus.openai}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${apiStatus.claude === 'operational' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>Claude API: {apiStatus.claude}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Histories */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* New Chat Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="flex items-center justify-center p-6">
                <Button variant="ghost" className="flex flex-col items-center gap-2 h-auto py-8">
                  <Plus size={40} />
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
                      <MessageSquare size={16} />
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