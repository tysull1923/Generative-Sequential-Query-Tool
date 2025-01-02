import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MoveUp, MoveDown, Trash2 } from 'lucide-react';

interface ChatCard extends Request{
 id: string;
 number: number;
 content: string;
 status: string;
 onMove: (id: string, direction: 'up' | 'down') => void;
 onDelete: (id: string) => void;
 onContentChange: (id: string, content: string) => void;
 isFirst: boolean;
 isLast: boolean;
 onAddPause: (id: string) => void;
}

const ChatCard = ({
 id,
 number,
 content,
 status,
 onMove,
 onDelete,
 onContentChange,
 isFirst,
 isLast,
 onAddPause
}: ChatCard) => (
 <Card className="my-4">
   <CardHeader className="p-4 pb-0">
     <div className="flex justify-between items-center">
       <span className="font-semibold">Request #{number}</span>
       <div className="flex gap-2">
         <Button
           variant="ghost"
           size="icon"
           onClick={() => onMove(id, 'up')}
           disabled={isFirst}
         >
           <MoveUp className="h-4 w-4" />
         </Button>
         <Button
           variant="ghost"
           size="icon"
           onClick={() => onMove(id, 'down')}
           disabled={isLast}
         >
           <MoveDown className="h-4 w-4" />
         </Button>
         <Button
           variant="ghost"
           size="icon"
           onClick={() => onDelete(id)}
         >
           <Trash2 className="h-4 w-4" />
         </Button>
       </div>
     </div>
   </CardHeader>
   <CardContent className="p-4">
     <Textarea
       placeholder="Type your request here..."
       value={content}
       onChange={(e) => onContentChange(id, e.target.value)}
       className="min-h-[100px]"
     />
     <div className="mt-2 flex justify-between items-center">
       <span className={`text-xs px-2 py-1 rounded-full ${
         status === 'completed' ? 'bg-green-100 text-green-800' :
         status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
         status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
         'bg-gray-100 text-gray-800'
       }`}>
         {status}
       </span>
       <Button
         variant="outline"
         size="sm"
         onClick={() => onAddPause(id)}
       >
         Add Pause After
       </Button>
     </div>
   </CardContent>
 </Card>
);

export default ChatCard;