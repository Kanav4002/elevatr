import React from 'react'
import { useAuth } from '../context/AuthContext';

// Simple HomePage component
const HomePage = () => {
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  }

  return (
    <div className='text-center p-8'>
      <h1 className='text-4xl font-bold text-gray-800 mb-4'>Welcome to Elevatr</h1>
      {user && (
        <>
          <p className='text-xl text-gray-600 mb-4'>
            Hello, {user.name}! ({user.role})
          </p>
          <button 
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
};

export default HomePage
