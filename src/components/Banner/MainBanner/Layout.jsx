import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './MainHeader';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;