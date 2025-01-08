// src/components/features/APIStatus.jsx
import React from 'react';
import { useAPIStatus } from '@/services/api/hooks/useAPIStatus';
import { ApiProvider, ApiStatus, ApiConfig } from '@/services/api/interfaces/api.types';


const APIStatus = () => {
  const { apiStatus, updateAPIKey } = useAPIStatus();
  const [ apiName, setAPIName] = React.useState<ApiConfig["name"]>();
  const [selectedAPI, setSelectedAPI] = React.useState<ApiProvider.OPENAI | ApiProvider.CLAUDE>(ApiProvider.OPENAI);
  const [openaiKey, setOpenaiKey] = React.useState('');
  const [claudeKey, setClaudeKey] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);

 


  const handleApiSelect = async (api: string) => {
    try{
      if (api == 'openai'){
        setSelectedAPI(ApiProvider.OPENAI);
        setAPIName("OpenAI");
      }else if (api == 'claude') {
        setSelectedAPI(ApiProvider.CLAUDE);
        setAPIName("Claude");
      }
    } catch (error){
      console.error(error);
    }
  }
  

  return (
    <div className="flex items-center space-x-4">
      
      
      <div className="flex items-center space-x-4">
          <select 
            value={selectedAPI}
            onChange={(e) => handleApiSelect(e.target.value)}//(e) => setSelectedAPI(e.target.value)}
            className="bg-gray-700 rounded px-3 py-1 text-sm"
          >
            <option value={ApiProvider.OPENAI}>OpenAI</option>
            <option value={ApiProvider.CLAUDE}>Claude</option>
          </select>
          {/* <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus.claude === 'Operational' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm">{apiStatus.claude}</span>
          </div> */}
          {selectedAPI && (
            <div className="flex items-center space-x-6">
            <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${
                apiStatus ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">{apiName}</span>
            </div>
          </div>  

          )}
        </div>

     

      
    </div>
  );
};

export default APIStatus;