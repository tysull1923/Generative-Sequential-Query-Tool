// src/components/features/ResponsePanel.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/shared/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Copy, Check } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SaveFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filename: string) => void;
}

const SaveFileModal: React.FC<SaveFileModalProps> = ({ isOpen, onClose, onSave }) => {
  const [filename, setFilename] = useState('');

  const handleSave = () => {
    onSave(filename);
    setFilename('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Response</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="filename" className="text-right">
              Filename
            </Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="col-span-3"
              placeholder="Enter filename"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!filename}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ResponsePanelProps {
  selectedRequestId: string | null;
  requests: any[];
  onSaveResponse: (id: string) => void;
  className?: string;
}

const ResponsePanel: React.FC<ResponsePanelProps> = ({
  selectedRequestId,
  requests,
  onSaveResponse,
  className = ''
}) => {
  const { toast } = useToast();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);

  const formatResponse = (response: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <p key={lastIndex} className="whitespace-pre-wrap">
            {response.slice(lastIndex, match.index)}
          </p>
        );
      }

      const language = match[1] || 'plaintext';
      const code = match[2];
      parts.push(
        <div key={match.index} className="relative group">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleCopy(code)}
          >
            {showCopySuccess ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            className="my-4 rounded"
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < response.length) {
      parts.push(
        <p key={lastIndex} className="whitespace-pre-wrap">
          {response.slice(lastIndex)}
        </p>
      );
    }

    return parts;
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
      toast({
        title: "Copied to clipboard",
        duration: 2000
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleSaveClick = (id: string) => {
    const response = requests.find(r => r.id === id)?.response?.content;
    if (response) {
      setCurrentResponse(response);
      setIsSaveModalOpen(true);
    }
  };

  const saveToFile = (filename: string) => {
    if (!currentResponse) return;

    const blob = new Blob([currentResponse], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File saved successfully",
      duration: 2000
    });
  };

  return (
    <div className={`h-full w-full flex flex-col ${className}`}>
      {selectedRequestId ? (
        <div className="flex flex-col h-full space-y-4 p-4">
          <div className="flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-semibold">Response</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleCopy(requests.find(r => r.id === selectedRequestId)?.response?.content || '')}
                className="flex items-center gap-2"
              >
                {showCopySuccess ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {showCopySuccess ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSaveClick(selectedRequestId)}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Response
              </Button>
            </div>
          </div>
          <Card className="flex-grow overflow-auto">
            <CardContent className="p-4 h-full">
              {formatResponse(requests.find(r => r.id === selectedRequestId)?.response?.content || 'No response yet')}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground p-4">
          Select a request to view its response
        </div>
      )}

      <SaveFileModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={saveToFile}
      />
    </div>
  );
};

export default ResponsePanel;







// import React from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent } from '@/components/ui/card';
// import { Save } from 'lucide-react';
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// interface ResponsePanelProps {
//   selectedRequestId: string | null;
//   requests: any[];
//   onSaveResponse: (id: string) => void;
//   className?: string; // Added to allow custom styling from parent
// }

// const ResponsePanel = ({ 
//   selectedRequestId, 
//   requests, 
//   onSaveResponse,
//   className = '' 
// }: ResponsePanelProps) => {
//   const formatResponse = (response: string) => {
//     const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
//     const parts = [];
//     let lastIndex = 0;
//     let match;

//     while ((match = codeBlockRegex.exec(response)) !== null) {
//       // Add text before code block
//       if (match.index > lastIndex) {
//         parts.push(
//           <p key={lastIndex} className="whitespace-pre-wrap">
//             {response.slice(lastIndex, match.index)}
//           </p>
//         );
//       }

//       // Add code block
//       const language = match[1] || 'plaintext';
//       const code = match[2];
//       parts.push(
//         <SyntaxHighlighter
//           key={match.index}
//           language={language}
//           style={vscDarkPlus}
//           className="my-4 rounded"
//         >
//           {code}
//         </SyntaxHighlighter>
//       );

//       lastIndex = match.index + match[0].length;
//     }

//     // Add remaining text
//     if (lastIndex < response.length) {
//       parts.push(
//         <p key={lastIndex} className="whitespace-pre-wrap">
//           {response.slice(lastIndex)}
//         </p>
//       );
//     }

//     return parts;
//   };

//   return (
//     <div className={`h-full w-full flex flex-col ${className}`}>
//       {selectedRequestId ? (
//         <div className="flex flex-col h-full space-y-4 p-4">
//           <div className="flex justify-between items-center flex-shrink-0">
//             <h2 className="text-xl font-semibold">Response</h2>
//             <Button
//               variant="outline"
//               onClick={() => onSaveResponse(selectedRequestId)}
//               className="flex items-center gap-2"
//             >
//               <Save className="h-4 w-4" />
//               Save Response
//             </Button>
//           </div>
//           <Card className="flex-grow overflow-auto">
//             <CardContent className="p-4 h-full">
//               {formatResponse(requests.find(r => r.id === selectedRequestId)?.response.content || 'No response yet')}
//             </CardContent>
//           </Card>
//         </div>
//       ) : (
//         <div className="flex items-center justify-center h-full text-muted-foreground p-4">
//           Select a request to view its response
//         </div>
//       )}
//     </div>
//   );
// };

// export default ResponsePanel;