// src/components/features/SystemContextCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';

interface SystemContextCardProps {
 content: string;
 onContentChange: (content: string) => void;
 onDelete: () => void;
}

const SystemContextCard = ({ content, onContentChange, onDelete }: SystemContextCardProps) => (
 <Card className="my-4 border-blue-200">
   <CardHeader className="p-4 pb-0">
     <div className="flex justify-between items-center">
       <span className="font-semibold text-blue-600">System Context</span>
       <Button
         variant="ghost"
         size="icon"
         onClick={onDelete}
       >
         <Trash2 className="h-4 w-4" />
       </Button>
     </div>
   </CardHeader>
   <CardContent className="p-4">
     <Textarea
       placeholder="Set system context here..."
       value={content}
       onChange={(e) => onContentChange(e.target.value)}
       className="min-h-[100px]"
     />
   </CardContent>
 </Card>
);

export default SystemContextCard;