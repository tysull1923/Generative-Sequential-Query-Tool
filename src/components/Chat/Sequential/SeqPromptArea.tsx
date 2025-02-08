// src/components/chat/SequentialChat/SeqPromptArea.tsx
// src/components/chat/SequentialChat/SeqPromptArea.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import ChatCard from '@/components/features/ChatCards/ChatCard';
import PauseStepCard from '@/components/features/ChatStepCards/PauseStepCard';
import DelayStepCard from '@/components/features/ChatStepCards/DelayStepCard';
import SystemContextCard from '@/components/features/SystemsContext/SystemContextCard';
import {
  ChatRequest,
  ChatType,
  Role,
  SequentialStepType,
  MessageStep,
  PauseStep,
  DelayStep,
  SequentialStep,
  ExecutionStatus,
  ChatCardState
} from '@/utils/types/chat.types';

interface SeqPromptAreaProps {
  steps: SequentialStep[];
  systemContext: string;
  showSystemContext: boolean;
  isProcessing: boolean;
  selectedStepId: string | null;
  width: number;
  executionStatus: ExecutionStatus;
  onAddStep: (type: SequentialStepType) => void;
  onMoveStep: (id: string, direction: 'up' | 'down') => void;
  onDeleteStep: (id: string) => void;
  onUpdateMessageContent: (id: string, content: string) => void;
  onTogglePauseStep: (id: string) => void;
  onUpdateDelayDuration: (id: string, duration: number) => void;
  onSystemContextChange: (content: string) => void;
  onSystemContextDelete: () => void;
  onStepSelect: (id: string) => void;
  onExecuteSteps: () => Promise<void>;
  onPauseExecution: () => void;
  className?: string;
}

// Type guards
const isMessageStep = (step: SequentialStep): step is MessageStep => {
  return step.type === SequentialStepType.MESSAGE;
};

const isPauseStep = (step: SequentialStep): step is PauseStep => {
  return step.type === SequentialStepType.PAUSE;
};

const isDelayStep = (step: SequentialStep): step is DelayStep => {
  return step.type === SequentialStepType.DELAY;
};

const SeqPromptArea: React.FC<SeqPromptAreaProps> = ({
  steps,
  systemContext,
  showSystemContext,
  isProcessing,
  selectedStepId,
  width,
  executionStatus,
  onAddStep,
  onMoveStep,
  onDeleteStep,
  onUpdateMessageContent,
  onTogglePauseStep,
  onUpdateDelayDuration,
  onSystemContextChange,
  onSystemContextDelete,
  onStepSelect,
  onExecuteSteps,
  onPauseExecution,
  className = ''
}) => {
  return (
    <div 
      className={`border-r bg-background flex flex-col flex-shrink-0 ${className}`}
      style={{ width }}
    >
      {/* Execution Controls */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onExecuteSteps}
              disabled={isProcessing || steps.length === 0}
              variant={isProcessing ? "secondary" : "default"}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin">⚡</span>
                  Processing...
                </>
              ) : (
                <>Execute Steps</>
              )}
            </Button>
            {executionStatus === ExecutionStatus.RUNNING && (
              <Button
                onClick={onPauseExecution}
                variant="outline"
                className="text-yellow-600"
              >
                Pause Execution
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span className={cn(
              "font-medium",
              executionStatus === ExecutionStatus.ERROR && "text-red-500",
              executionStatus === ExecutionStatus.COMPLETED && "text-green-500",
              executionStatus === ExecutionStatus.RUNNING && "text-blue-500",
              executionStatus === ExecutionStatus.PAUSED && "text-yellow-500"
            )}>
              {executionStatus === ExecutionStatus.IDLE && "Ready"}
              {executionStatus === ExecutionStatus.RUNNING && "Running"}
              {executionStatus === ExecutionStatus.PAUSED && "Paused"}
              {executionStatus === ExecutionStatus.COMPLETED && "Completed"}
              {executionStatus === ExecutionStatus.ERROR && "Error"}
            </span>
          </div>
        </div>
      </div>

      {/* Steps Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* System Context */}
        {showSystemContext && (
          <SystemContextCard
            content={systemContext}
            onContentChange={onSystemContextChange}
            onDelete={onSystemContextDelete}
          />
        )}

        {/* Step Cards */}
        {steps.map((step, index) => {
          if (isPauseStep(step)) {
            return (
              <PauseStepCard
                key={step.id}
                isPaused={'isPaused' in step ? step.isPaused : true}
                onToggle={() => onTogglePauseStep(step.id)}
                number={step.position + 1}
                onDelete={() => onDeleteStep(step.id)}
              />
            );
          }

          if (isDelayStep(step)) {
            return (
              <DelayStepCard
                key={step.id}
                id={step.id}
                duration={step.duration}
                number={step.position + 1}
                onDurationChange={onUpdateDelayDuration}
                onDelete={onDeleteStep}
                onMove={onMoveStep}
                isFirst={index === 0}
                isLast={index === steps.length - 1}
              />
            );
          }

          if (isMessageStep(step)) {
            const cardState = executionStatus === ExecutionStatus.RUNNING 
              ? ChatCardState.SENT 
              : step.response 
                ? ChatCardState.COMPLETE 
                : ChatCardState.READY;

            return (
              <ChatCard
                key={step.id}
                id={step.id}
                number={step.position + 1}
                content={isMessageStep(step) ? step.message.content : ''}
                status={cardState}
                chatType={ChatType.SEQUENTIAL}
                isFirst={index === 0}
                isLast={index === steps.length - 1}
                onMove={onMoveStep}
                onDelete={() => onDeleteStep(step.id)}
                onContentChange={(content) => onUpdateMessageContent(step.id, content)}
                onClick={() => onStepSelect(step.id)}
                isEditable={true}
              />
            );
          }

          return null;
        })}

        {/* Add Step Buttons */}
        <div className="space-y-2">
          <Button
            onClick={() => onAddStep(SequentialStepType.MESSAGE)}
            className="w-full flex items-center justify-center gap-2"
            disabled={isProcessing}
          >
            <Plus className="h-4 w-4" />
            Add Message Step
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SeqPromptArea;



// // src/components/chat/SequentialChat/SeqPromptArea.tsx
// import React from 'react';
// import { Plus } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import ChatCard from '@/components/features/ChatCards/ChatCard';
// import PauseStepCard from '@/components/features/ChatStepCards/PauseStepCard';
// import DelayStepCard from '@/components/features/ChatStepCards/DelayStepCard';
// import SystemContextCard from '@/components/features/SystemsContext/SystemContextCard';
// import {
//   ChatRequest,
//   ChatType,
//   Role,
//   SequentialStepType,
//   MessageStep,
//   PauseStep,
//   DelayStep,
//   SequentialStep
// } from '@/utils/types/chat.types';

// interface SeqPromptAreaProps {
//   steps: SequentialStep[];
//   systemContext: string;
//   showSystemContext: boolean;
//   isProcessing: boolean;
//   selectedStepId: string | null;
//   width: number;
//   onAddStep: (type: SequentialStepType) => void;
//   onMoveStep: (id: string, direction: 'up' | 'down') => void;
//   onDeleteStep: (id: string) => void;
//   onUpdateMessageContent: (id: string, content: string) => void;
//   onTogglePauseStep: (id: string) => void;
//   onUpdateDelayDuration: (id: string, duration: number) => void;
//   onSystemContextChange: (content: string) => void;
//   onSystemContextDelete: () => void;
//   onStepSelect: (id: string) => void;
//   className?: string;
// }

// // Type guards
// const isMessageStep = (step: SequentialStep): step is MessageStep => {
//   return step.type === SequentialStepType.MESSAGE;
// };

// const isPauseStep = (step: SequentialStep): step is PauseStep => {
//   return step.type === SequentialStepType.PAUSE;
// };

// const isDelayStep = (step: SequentialStep): step is DelayStep => {
//   return step.type === SequentialStepType.DELAY;
// };

// const SeqPromptArea: React.FC<SeqPromptAreaProps> = ({
//   steps,
//   systemContext,
//   showSystemContext,
//   isProcessing,
//   selectedStepId,
//   width,
//   onAddStep,
//   onMoveStep,
//   onDeleteStep,
//   onUpdateMessageContent,
//   onTogglePauseStep,
//   onUpdateDelayDuration,
//   onSystemContextChange,
//   onSystemContextDelete,
//   onStepSelect,
//   className = ''
// }) => {
//   return (
//     <div 
//       className={`border-r bg-background overflow-y-auto flex-shrink-0 ${className}`}
//       style={{ width }}
//     >
//       <div className="p-4 space-y-4">
//         {/* System Context */}
//         {showSystemContext && (
//           <SystemContextCard
//             content={systemContext}
//             onContentChange={onSystemContextChange}
//             onDelete={onSystemContextDelete}
//           />
//         )}

//         {/* Step Cards */}
//         {steps.map((step, index) => {
//           if (isPauseStep(step)) {
//             return (
//               <PauseStepCard
//                 key={step.id}
//                 isPaused={'isPaused' in step ? step.isPaused : true}
//                 onToggle={() => onTogglePauseStep(step.id)}
//                 number={step.position + 1}
//                 onDelete={() => onDeleteStep(step.id)}
//               />
//             );
//           }

//           if (isDelayStep(step)) {
//             return (
//               <DelayStepCard
//                 key={step.id}
//                 id={step.id}
//                 duration={step.duration}
//                 number={step.position + 1}
//                 onDurationChange={onUpdateDelayDuration}
//                 onDelete={onDeleteStep}
//                 onMove={onMoveStep}
//                 isFirst={index === 0}
//                 isLast={index === steps.length - 1}
//               />
//             );
//           }

//           if (isMessageStep(step)) {
//             return (
//               <ChatCard
//                 key={step.id}
//                 id={step.id}
//                 number={step.position + 1}
//                 content={step.message.content}
//                 status="pending" // You'll need to track status
//                 chatType={ChatType.SEQUENTIAL}
//                 isFirst={index === 0}
//                 isLast={index === steps.length - 1}
//                 onMove={onMoveStep}
//                 onDelete={() => onDeleteStep(step.id)}
//                 onContentChange={(content) => onUpdateMessageContent(step.id, content)}
//                 onClick={() => onStepSelect(step.id)}
//               />
//             );
//           }

//           return null;
//         })}

//         {/* Add Step Buttons */}
//         <div className="space-y-2">
//           <Button
//             onClick={() => onAddStep(SequentialStepType.MESSAGE)}
//             className="w-full flex items-center justify-center gap-2"
//             disabled={isProcessing}
//           >
//             <Plus className="h-4 w-4" />
//             Add Message Step
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SeqPromptArea;