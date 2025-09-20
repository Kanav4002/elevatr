import React from 'react'
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className='text-center p-8 max-w-4xl mx-auto'>
      <h1 className='text-4xl font-bold text-gray-800 mb-6'>Welcome to Elevatr</h1>
      
      {user && (
        <>
          <p className='text-xl text-gray-600 mb-8'>
            Hello, {user.name}! ({user.role})
          </p>
          
          {/* Add some quick action cards based on user role */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {user.role === 'student' ? (
              // Student quick actions
              <>
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Find Jobs</h3>
                  <p className="text-blue-600 text-sm">Discover exciting opportunities</p>
                </div>

                <Link to="/projects/new" className="bg-green-50 p-6 rounded-lg border border-green-200 hover:bg-green-100 transition duration-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Add Project</h3>
                  <p className="text-green-600 text-sm">Showcase your work</p>
                </Link>

                <Link to="/projects/my" className="bg-orange-50 p-6 rounded-lg border border-orange-200 hover:bg-orange-100 transition duration-200">
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">My Projects</h3>
                  <p className="text-orange-600 text-sm">View & manage portfolio</p>
                </Link>

                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">Applications</h3>
                  <p className="text-purple-600 text-sm">Track your applications</p>
                </div>
              </>
            ) : (
              // Recruiter quick actions
              <>
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Post Job</h3>
                  <p className="text-blue-600 text-sm">Create new job listings</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Candidates</h3>
                  <p className="text-green-600 text-sm">Browse student profiles</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">My Jobs</h3>
                  <p className="text-purple-600 text-sm">Manage your listings</p>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;