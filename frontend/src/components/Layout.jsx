import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';

const Layout = () => {
  return (
    <div className='min-h-screen flex flex-col'>
      <Navbar />
      
      <main className='flex-1 py-8'>
        <Outlet /> {/* This renders the current route's component */}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;