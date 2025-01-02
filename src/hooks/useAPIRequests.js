import { useState } from 'react';
import { openAIService } from '../services/openai';
import { anthropicService } from '../services/anthropic';

export const useApiRequests = () => {
  const [isProcessing, setIsProcessing] = useState(true);

  const processRequests = async (requests, selectedAPI, delay = 0) => {
    console.log('Starting requests processing');
    
    //isProcessing = useState(true);
    setIsProcessing(true);
    console.log(isProcessing);
    const service = openAIService;
    //selectedAPI === 'OpenAI' ? openAIService : anthropicService;
    // const apiKey = localStorage.getItem(
    //   selectedAPI === 'OpenAI' ? 'OPENAI_API_KEY' : 'CLAUDE_API_KEY'
    // ) || import.meta.env.VITE_OPENAI_API_KEY;

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    console.log('Got API key:', apiKey ? 'Yes' : 'No');

    const updatedRequests = [...requests];
    console.log('Processing requests:', updatedRequests);
 
    for (let i = 0; i < updatedRequests.length; i++) {
      const request = updatedRequests[i];
      console.log('Processing request', i, request);
      
    //   if (!isProcessing) {
    //     console.log('Processing stopped');
    //     break;
    //   }
      
      try {
        console.log('Sending chat request:', request.content);
        const response = await service.sendChat([{
          role: 'user',
          content: request.content
        }], apiKey);
        console.log('Got response:', response);
 
        if (response && response.content) {
          console.log('Updating request with response');
          updatedRequests[i] = {
            ...request,
            response: response.content,
            status: 'completed'
          };
        }
 
      } catch (error) {
        console.error('Request failed:', error);
        updatedRequests[i] = {
          ...request,
          status: 'error',
          response: `Error: ${error.message}`
        };
      }
    }
    console.log('Finished processing requests');
    setIsProcessing(false);
  };
 
  return { processRequests, isProcessing, setIsProcessing };
};
















//     for (const request of requests) {
//       console.log(isProcessing);

//       //if (!isProcessing) break;
//       console.log('Starting request');

//       try {
//         request.status = 'in-progress';
//         console.log('Sending request:' + request.id);
//         try {
//             const response = await service.sendChat([{
//                 role: 'user',
//                 content: request.content
//               }], apiKey);
//             request.response = response.content;
//             request.status = 'completed';
//         } catch(error){
//             console.log('Error sending request' + error.message);
//         }
        

//         // Update request with response
        

//         if (delay > 0) {
//           await new Promise(resolve => setTimeout(resolve, delay * 1000));
//         }
//       } catch (error) {
//         request.status = 'error';
//         request.response = `Error: ${error.message}`;
//         console.log('Error in API Request:' + error.message);

//       }
//     }
//     //setIsProcessing(false);
//   };

//   return { processRequests, isProcessing, setIsProcessing };
// };