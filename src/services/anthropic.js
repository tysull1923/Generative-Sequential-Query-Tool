const CLAUDE_API_URL = 'https://api.anthropic.com/v1';

export const anthropicService = {
  async checkConnection(apiKey) {
    try {
      const response = await fetch(`${CLAUDE_API_URL}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }],
          model: 'claude-3-opus-20240229',
          max_tokens: 1
        })
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },

  async sendChat(messages, apiKey) {
    const response = await fetch(`${CLAUDE_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        messages,
        model: 'claude-3-opus-20240229'
      })
    });

    if (!response.ok) {
      throw new Error('Claude API error');
    }

    return response.json();
  }
};