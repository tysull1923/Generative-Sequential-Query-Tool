import React from 'react';
import Header from '../components/Header';

const Chat = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-4">
          <div className="w-1/3 bg-white rounded-lg shadow p-4">
            {/* Sequential requests will go here */}
          </div>
          <div className="w-2/3 bg-white rounded-lg shadow p-4">
            {/* Responses will go here */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;