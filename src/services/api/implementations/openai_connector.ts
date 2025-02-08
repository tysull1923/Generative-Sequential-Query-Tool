import { ApiConfig } from "../interfaces/api.types";

const OPENAI_API_URL = 'https://api.openai.com/v1';

export const openAIService = {
  async checkConnection(apiKey: ApiConfig['apiKey']) {
    try {
      const response = await fetch(`${OPENAI_API_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  async sendChat(messages: any, apiKey: ApiConfig['apiKey'] | undefined) {
    if (!messages || !messages.length || !apiKey) {
      throw new Error('Invalid request parameters');
    }
  
    try {
      const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages,
          temperature: 0.7
        })
      });
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('OpenAI request failed:', error);
      throw error;
    }


    // try {
    //   const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${apiKey}`
    //     },
    //     body: JSON.stringify({
    //       model: 'gpt-4',
    //       messages,
    //       temperature: 0.7
    //     })
    //   });
    // } catch (error){
    //   console.log("Error receiving response" + error.message);
    // }
    
    
    // if (!response.ok) {
    //   console.log("Error in response");
    //   throw new Error('OpenAI API error');
    // }
    
    // const data = await response.json();
    // return {
    //   content: data.choices[0].message.content
    // };
  }
};