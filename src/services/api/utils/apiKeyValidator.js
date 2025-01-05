// src/lib/utils/apiKeyValidator.js


export async function validateOpenAIKey(apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('OpenAI API validation error:', error);
      return false;
    }
  }
  
  export async function validateClaudeKey(apiKey) {
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