import Header from '@/components/layout/Header';
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, EyeOff, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SettingsPage = () => {
  const [keys, setKeys] = useState({
    openai: localStorage.getItem('openai_api_key') || '',
    claude: localStorage.getItem('claude_api_key') || ''
  });
  
  const [status, setStatus] = useState({
    openai: { isValid: false, checking: false, error: null },
    claude: { isValid: false, checking: false, error: null }
  });
  
  const [showKeys, setShowKeys] = useState({
    openai: false,
    claude: false
  });

  const validateKey = async (type, key) => {
    setStatus(prev => ({
      ...prev,
      [type]: { ...prev[type], checking: true, error: null }
    }));

    try {
      // Example validation endpoints
      const endpoint = type === 'openai' 
        ? 'https://api.openai.com/v1/models'
        : 'https://api.anthropic.com/v1/messages';

      const headers = type === 'openai'
        ? { 'Authorization': `Bearer ${key}` }
        : { 'x-api-key': key, 'anthropic-version': '2023-06-01' };

      const response = await fetch(endpoint, { headers });
      
      if (!response.ok) throw new Error('Invalid API key');

      setStatus(prev => ({
        ...prev,
        [type]: { isValid: true, checking: false, error: null }
      }));

      localStorage.setItem(`${type}_api_key`, key);
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        [type]: { isValid: false, checking: false, error: error.message }
      }));
    }
  };

  const handleKeyChange = (type, value) => {
    setKeys(prev => ({ ...prev, [type]: value }));
    setStatus(prev => ({
      ...prev,
      [type]: { isValid: false, checking: false, error: null }
    }));
  };

  const toggleKeyVisibility = (type) => {
    setShowKeys(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Header />
      <h1 className="text-2xl font-bold mb-8">API Settings</h1>
      
      <div className="space-y-6">
        {/* OpenAI Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">OpenAI API Key</h2>
          <div className="relative">
            <input
              type={showKeys.openai ? "text" : "password"}
              value={keys.openai}
              onChange={(e) => handleKeyChange('openai', e.target.value)}
              className="w-full p-2 pr-10 border rounded-md"
              placeholder="Enter OpenAI API key"
            />
            <button
              onClick={() => toggleKeyVisibility('openai')}
              className="absolute right-3 top-2.5 text-gray-500"
            >
              {showKeys.openai ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => validateKey('openai', keys.openai)}
              disabled={!keys.openai || status.openai.checking}
              className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
            >
              {status.openai.checking ? 'Validating...' : 'Validate Key'}
            </button>
            
            {status.openai.isValid && (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="mr-2" size={20} />
                <span>Connected</span>
              </div>
            )}
            
            {status.openai.error && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{status.openai.error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Claude Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Claude API Key</h2>
          <div className="relative">
            <input
              type={showKeys.claude ? "text" : "password"}
              value={keys.claude}
              onChange={(e) => handleKeyChange('claude', e.target.value)}
              className="w-full p-2 pr-10 border rounded-md"
              placeholder="Enter Claude API key"
            />
            <button
              onClick={() => toggleKeyVisibility('claude')}
              className="absolute right-3 top-2.5 text-gray-500"
            >
              {showKeys.claude ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => validateKey('claude', keys.claude)}
              disabled={!keys.claude || status.claude.checking}
              className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
            >
              {status.claude.checking ? 'Validating...' : 'Validate Key'}
            </button>
            
            {status.claude.isValid && (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="mr-2" size={20} />
                <span>Connected</span>
              </div>
            )}
            
            {status.claude.error && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{status.claude.error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;