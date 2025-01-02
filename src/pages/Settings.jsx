import React from 'react';
import Header from '../components/Header';

const Settings = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        {/* Settings content will go here */}
      </main>
    </div>
  );
};

export default Settings;