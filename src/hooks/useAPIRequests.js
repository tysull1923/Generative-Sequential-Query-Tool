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
 
    try {
        
        const messages = requests
          .filter(req => req.type === 'chat')
          .map(req => ({
            role: 'user',
            content: req.content
          }));
  
        console.log('Sending messages:', messages);
        
        const response = await service.sendChat(messages, apiKey);
        console.log('API Response:', response);
  
        // Update all requests with their responses
        if (response.choices) {
          const updatedRequests = requests.map((req, index) => ({
            ...req,
            response: response.choices[index]?.message?.content || 'No response received',
            status: 'completed'
          }));
          console.log(updatedRequests);
          return updatedRequests;
        }
      } catch (error) {
        console.error('Batch request failed:', error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    
    
    
    
    
    
    
    //Was working 
    
//     for (let i = 0; i < updatedRequests.length; i++) {
//       const request = updatedRequests[i];
//       console.log('Processing request', i, request);
      
//     //   if (!isProcessing) {
//     //     console.log('Processing stopped');
//     //     break;
//     //   }
//       if (request.type === 'chat'){
//         try {
//             console.log('Sending chat request:', request.content);
//             const result = await service.sendChat([{
//               role: 'user',
//               content: request.content
//             }], apiKey);
//             console.log('Got response:', result);
     
//             if (result && result.choices[0].message.content) {
//               console.log('Updating request with response');
//               updatedRequests[i] = {
//                 ...request,
//                 response: result.choices[0].message.content,
//                 status: 'completed'
//               };
//               console.log(result.choices[0].message.content)
//             }
     
//           } catch (error) {
//             console.error('Request failed:', error);
//             updatedRequests[i] = {
//               ...request,
//               status: 'error',
//               response: `Error: ${error.message}`
//             };
//           }
//       }
      
//     }
//     console.log('Finished processing requests');
//     setIsProcessing(false);
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