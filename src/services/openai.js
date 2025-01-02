const OPENAI_API_URL = 'https://api.openai.com/v1';

export const openAIService = {
  async checkConnection(apiKey) {
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

  async sendChat(messages, apiKey) {
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
      throw new Error('OpenAI API error');
    }
    
    return response.json();
  }
};