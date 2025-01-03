// src/components/features/ResponsePanel.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ResponsePanelProps {
 selectedRequestId: string | null;
 requests: any[];
 onSaveResponse: (id: string) => void;
}

const ResponsePanel = ({ selectedRequestId, requests, onSaveResponse }: ResponsePanelProps) => {
 const formatResponse = (response: string) => {
   const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
   const parts = [];
   let lastIndex = 0;
   let match;

   while ((match = codeBlockRegex.exec(response)) !== null) {
     // Add text before code block
     if (match.index > lastIndex) {
       parts.push(
         <p key={lastIndex} className="whitespace-pre-wrap">
           {response.slice(lastIndex, match.index)}
         </p>
       );
     }

     // Add code block
     const language = match[1] || 'plaintext';
     const code = match[2];
     parts.push(
       <SyntaxHighlighter
         key={match.index}
         language={language}
         style={vscDarkPlus}
         className="my-4 rounded"
       >
         {code}
       </SyntaxHighlighter>
     );

     lastIndex = match.index + match[0].length;
   }

   // Add remaining text
   if (lastIndex < response.length) {
     parts.push(
       <p key={lastIndex} className="whitespace-pre-wrap">
         {response.slice(lastIndex)}
       </p>
     );
   }

   return parts;
 };

 return (
   <div className="w-2/3 p-4 bg-background overflow-y-auto">
     {selectedRequestId ? (
       <div className="space-y-4">
         <div className="flex justify-between items-center">
           <h2 className="text-xl font-semibold">Response</h2>
           <Button
             variant="outline"
             onClick={() => onSaveResponse(selectedRequestId)}
             className="flex items-center gap-2"
           >
             <Save className="h-4 w-4" />
             Save Response
           </Button>
         </div>
         <Card>
           <CardContent className="p-4">
             {formatResponse(requests.find(r => r.id === selectedRequestId)?.response || 'No response yet')}
           </CardContent>
         </Card>
       </div>
     ) : (
       <div className="flex items-center justify-center h-full text-muted-foreground">
         Select a request to view its response
       </div>
     )}
   </div>
 );
};

export default ResponsePanel;