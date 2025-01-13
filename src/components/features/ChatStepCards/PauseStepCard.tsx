import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2 } from 'lucide-react';

interface PauseStepCardProps {
  isPaused: boolean | undefined;
  onToggle: () => void;
  number: number;
  onDelete: (stepNumber: number) => void;
}

const PauseStepCard: React.FC<PauseStepCardProps> = ({ 
  isPaused, 
  onToggle, 
  number, 
  onDelete 
}) => (
  <Card className="my-4">
    <CardContent className="p-4 flex justify-between items-center">
      <span className="font-semibold">Pause Step #{number}</span>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onToggle}>
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(number)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default PauseStepCard;