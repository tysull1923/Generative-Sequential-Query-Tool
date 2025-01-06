import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Pause, Play, Save, MoveUp, MoveDown, Trash2, Plus } from 'lucide-react';
import Header  from "@/components/Banner/MainBanner/MainHeader";
import ChatControlBanner from '@/components/Banner/ChatBanner/ChatControlBanner';
import { useApiService } from '@/hooks/useAPIRequest';
import ChatCard from '@/components/features/seqChatCard';
import PauseStepCard from '@/components/features/PauseStepCard';
import ResponsePanel from '@/components/features/ResponsePanel';
import SystemContextCard from '@/components/features/SystemContextCard';
import ChatBanner from '@/components/Banner/ChatBanner/ChatBanner';
// interface ChatRequest {
//   id: string;
//   number: number;
//   content: string;
//   status: 'pending' | 'in-progress' | 'completed' | 'paused';
//   response?: string;
// }
interface ChatRequest {
  id: string;
  type: 'chat' | 'pause';
  content?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'paused';
  response?: string;
  isPaused?: boolean;
  number: number;
}

const NewChatPage = () => {
  const [requests, setRequests] = useState<ChatRequest[]>([
    {
      id: '1',
      type: 'chat',
      number: 1,
      content: '',
      status: 'pending'
    }
   ]);
   const [systemContext, setSystemContext] = useState<string>('');
   const [showSystemContext, setShowSystemContext] = useState(false);
   const addPauseStep = (afterId: string) => {
    const index = requests.findIndex(r => r.id === afterId);
    const afterRequest = requests[index];
    
    const newRequests = [...requests];
    newRequests.splice(index + 1, 0, {
      id: Date.now().toString(),
      type: 'pause',
      number: afterRequest.number, // Use the number of the request it follows
      status: 'pending',
      isPaused: true
    });
    setRequests(newRequests);
  };
  
  const addNewRequest = () => {
    const chatRequests = requests.filter(r => r.type === 'chat');
    const newNumber = chatRequests.length + 1;
    setRequests([...requests, {
      id: Date.now().toString(),
      type: 'chat',
      number: newNumber,
      content: '',
      status: 'pending'
    }]);
  };

   const togglePauseStep = (id: string) => {
    setRequests(requests.map(req => {
      if (req.id === id && req.type === 'pause') {
        return {
          ...req,
          isPaused: !req.isPaused
        };
      }
      return req;
    }));
  };
  const [selectedAPI] = useState('OpenAI');
  const { processRequests, isProcessing, setIsProcessing, conversationHistory} = useApiService(systemContext);

  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const updateRequestContent = (id: string, content: string) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, content } : req
    ));
  };

  const moveRequest = (id: string, direction: 'up' | 'down') => {
    const index = requests.findIndex(r => r.id === id);
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === requests.length - 1)) return;

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
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const deleteRequest = (id: string) => {
    setRequests(requests.filter(req => req.id !== id));
  };

  const saveResponse = (id: string) => {
    const request = requests.find(r => r.id === id);
    if (!request?.response) return;
    console.log('Saving response for request:', id);
  };
  const delay = 0; 
  const handlePlay = async (delay: number) => {
    try {
      console.log('Starting request process');
      setIsProcessing(true);
      await processRequests(requests, selectedAPI);
    } catch (error) {
      console.error('Request failed:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Banner */}
      <Header />
      <ChatControlBanner 
        onAddStep={(type) => {/* Handle step addition */}}
        //onPlay={handlePlay}
        onPlay={handlePlay}
        onPause={() => setIsProcessing(false)}
        isPlaying={isProcessing}
      />
      <ChatBanner
        chatType={ChatType.BASE}
        title={title}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onTitleChange={setTitle}
      />
      <main className="flex flex-1">
        {/* Left Panel - Requests (1/3 width) */}
        <div className="w-1/3 border-r p-4 bg-background overflow-y-auto">
          <div className="space-y-4">
          {/* Add System Context Button */}
          {!showSystemContext && (
            <Button
              onClick={() => setShowSystemContext(true)}
              className="w-full flex items-center justify-center gap-2 mb-4"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Add System Context
            </Button>
          )}
          
          {/* System Context Card */}
          {showSystemContext && (
            <SystemContextCard
              content={systemContext}
              onContentChange={setSystemContext}
              onDelete={() => {
                setShowSystemContext(false);
                setSystemContext('');
              }}
            />
          )}
          {requests.map((request, index) => (
            request.type === 'pause' ? (
              <PauseStepCard
                key={request.id}
                number={request.number}
                isPaused={request.isPaused}
                onToggle={() => togglePauseStep(request.id)}
                onDelete={() => deleteRequest(request.id)}
              />
            ) : (
              <ChatCard
                key={request.id}
                id={request.id}
                number={request.number}
                content={request.content || ''}
                status={request.status}
                isFirst={index === 0}
                isLast={index === requests.length - 1}
                onMove={moveRequest}
                onDelete={deleteRequest}
                onContentChange={updateRequestContent}
                onAddPause={addPauseStep}
                onClick={() => setSelectedRequestId(request.id)} // Add this line
                response={request.response} // Add this line
                // key={request.id}
                // {...request}
                // isFirst={index === 0}
                // isLast={index === requests.length - 1}
                // onMove={moveRequest}
                // onDelete={deleteRequest}
                // onContentChange={updateRequestContent}
                // onAddPause={addPauseStep}
              />
            )
          ))}
            {/* {requests.map((request) => (
              <Card 
                key={request.id}
                className={`transition-shadow hover:shadow-md ${
                  selectedRequest === request.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedRequest(request.id)}
              >
                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Request #{request.number}</span>
                    <div className="flex gap-2">
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
                </CardHeader>
                <CardContent className="p-4">
                  <Textarea
                    placeholder="Type your request here..."
                    value={request.content}
                    onChange={(e) => updateRequestContent(request.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="min-h-[100px]"
                  />
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      request.status === 'completed' ? 'bg-green-100 text-green-800' :
                      request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))} */}
            <Button
              onClick={addNewRequest}
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Request
            </Button>
          </div>
        </div>

        {/* Right Panel - Responses (2/3 width) */}
        <ResponsePanel
          selectedRequestId={selectedRequestId}
          requests={requests}
          onSaveResponse={saveResponse}
        />
        {/* <div className="w-2/3 p-4 bg-background overflow-y-auto">
          {selectedRequestId ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Response</h2>
                <Button
                  variant="outline"
                  onClick={() => saveResponse(selectedRequestId)}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Response
                </Button>
              </div>
              <Card>
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap">
                    {requests.find(r => r.id === selectedRequestId)?.response || 'No response yet'}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a request to view its response
            </div>
          )}
        </div> */}
        
      </main>
    </div>
  );
};

export default NewChatPage;