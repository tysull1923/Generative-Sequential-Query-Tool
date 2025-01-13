// src/components/features/ChatHistory/ChatHistoryPanel.tsx

import React from 'react';
import { Trash2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatRequest } from '@/utils/types/chat.types';

interface ChatHistoryPanelProps {
  history: ChatRequest[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  history,
  onRestore,
  onDelete,
  onClear
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <Button 
          onClick={onClear}
          variant="ghost" 
          size="sm"
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* History List */}
      <ScrollArea className="flex-1 p-4">
        {history.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            No history yet
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                {/* Content Preview */}
                <div className="mb-2">
                  <div className="font-medium">Request #{item.number}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {item.content}
                  </div>
                </div>

                {/* Response Preview */}
                {item.response && (
                  <div className="mb-2 pl-4 border-l-2">
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {typeof item.response.content === 'string' 
                        ? item.response.content 
                        : 'Complex response'}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    onClick={() => onDelete(item.id)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onRestore(item.id)}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ChatHistoryPanel;