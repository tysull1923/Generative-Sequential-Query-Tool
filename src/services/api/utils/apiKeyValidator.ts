// src/lib/utils/apiKeyValidator.js

import { ApiConfig } from "@/services/api/interfaces/api.types";
import { openAIService } from "@/services/api/implementations/openai_connector";

export async function validateOpenAIKey(apiKey: ApiConfig["apiKey"]) {
    try {
      return openAIService.checkConnection(apiKey);
      // const response = await fetch('https://api.openai.com/v1/models', {
      //   headers: {
      //     'Authorization': `Bearer ${apiKey}`,
      //   },
      // });
      
      // return response.status === 200;
    } catch (error) {
      console.error('OpenAI API validation error:', error);
      return false;
    }
  }
  
  export async function validateClaudeKey(apiKey: ApiConfig["apiKey"]) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 1
        })
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Claude API validation error:', error);
      return false;
    }
  }