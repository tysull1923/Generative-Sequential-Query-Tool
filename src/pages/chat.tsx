import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Pause, Play, Save, MoveUp, MoveDown, Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header';

interface Request {
  id: string;
  content: string;
  status: 'pending' | 'in-progress' | 'completed' | 'paused';
  response?: string;
}

const ChatPage = () => {
  const [requests, setRequests] = useState<Request[]>([
    {
      id: '1',
      content: 'First request: Analyze the code structure',
      status: 'completed',
      response: 'The code follows a modular architecture with clear separation of concerns...'
    },
    {
      id: '2',
      content: 'Second request: Suggest improvements',
      status: 'in-progress',
    },
    {
      id: '3',
      content: 'Third request: Implement suggested changes',
      status: 'pending',
    }
  ]);

  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const moveRequest = (id: string, direction: 'up' | 'down') => {
    const index = requests.findIndex(r => r.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === requests.length - 1)
    ) return;

    const newRequests = [...requests];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newRequests[index], newRequests[swapIndex]] = [newRequests[swapIndex], newRequests[index]];
    setRequests(newRequests);
  };

  const toggleRequestStatus = (id: string) => {
    setRequests(requests.map(req => {
      if (req.id === id) {
        return {
          ...req,
          status: req.status === 'paused' ? 'in-progress' : 'paused'
        };
      }
      return req;
    }));
  };

  const deleteRequest = (id: string) => {
    setRequests(requests.filter(req => req.id !== id));
  };

  const saveResponse = (id: string) => {
    const request = requests.find(r => r.id === id);
    if (!request?.response) return;
    
    // Implementation for saving response
    console.log('Saving response for request:', id);
  };

  return (
    
    <div className="min-h-screen flex flex-col">
      {/* Top Banner */}
      <Header />
      {/* Left Panel - Requests (1/3 width) */}
      <main className="flex flex-1">
        <div className="w-1/3 border-r p-4 bg-background overflow-y-auto">
          <div className="space-y-4">
            {requests.map((request) => (
              <Card 
                key={request.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${selectedRequest === request.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedRequest(request.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm mb-2">{request.content}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${request.status === 'completed' ? 'bg-green-100 text-green-800' : request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : request.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveRequest(request.id, 'up');
                        }}
                        disabled={requests.indexOf(request) === 0}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveRequest(request.id, 'down');
                        }}
                        disabled={requests.indexOf(request) === requests.length - 1}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRequestStatus(request.id);
                        }}
                      >
                        {request.status === 'paused' ? (
                          <Play className="h-4 w-4" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRequest(request.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Panel - Responses (2/3 width) */}
        <div className="w-2/3 p-4 bg-background overflow-y-auto">
          {selectedRequest ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Response
                </h2>
                <Button
                  variant="outline"
                  onClick={() => saveResponse(selectedRequest)}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Response
                </Button>
              </div>
              <Card>
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap">
                    {requests.find(r => r.id === selectedRequest)?.response || 'Response will appear here...'}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a request to view its response
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChatPage;