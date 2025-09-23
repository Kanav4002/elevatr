import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  // If user is not authenticated, show landing page
  if (!isAuthenticated()) {
    return <LandingPage />;
  }

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Get user's first name
  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* User Avatar */}
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                
                {/* Welcome Text */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {getGreeting()}, {firstName}! 👋
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    Welcome back to your {user?.role === 'student' ? 'student' : 'recruiter'} dashboard
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Action Button */}
              <div className="hidden md:block">
                {user?.role === 'student' ? (
                  <Link
                    to="/projects/new"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Project
                  </Link>
                ) : (
                  <Link
                    to="/jobs"
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM9 12l2 2 4-4" />
                    </svg>
                    Post New Job
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {user?.role === 'student' ? (
            // Student Quick Actions
            <>
              <Link to="/projects/browse" className="group">
                <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-200 group-hover:border-blue-200">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Projects</h3>
                  <p className="text-gray-600 text-sm">Discover amazing projects from other students</p>
                </div>
              </Link>

              <Link to="/projects/my" className="group">
                <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-200 group-hover:border-green-200">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">My Projects</h3>
                  <p className="text-gray-600 text-sm">Manage and showcase your work</p>
                </div>
              </Link>

              <Link to="/jobs" className="group">
                <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-200 group-hover:border-purple-200">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Jobs</h3>
                  <p className="text-gray-600 text-sm">Explore internship and job opportunities</p>
                </div>
              </Link>

              <Link to="/messages" className="group">
                <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-200 group-hover:border-orange-200">
                  <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                    <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages</h3>
                  <p className="text-gray-600 text-sm">Connect with recruiters and peers</p>
                </div>
              </Link>
            </>
          ) : (
            // Recruiter Quick Actions
            <>
              <Link to="/projects/browse" className="group">
                <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-200 group-hover:border-blue-200">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Talent</h3>
                  <p className="text-gray-600 text-sm">Discover talented students and their projects</p>
                </div>
              </Link>

              <Link to="/jobs" className="group">
                <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-200 group-hover:border-green-200">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Post Jobs</h3>
                  <p className="text-gray-600 text-sm">Create job listings and find candidates</p>
                </div>
              </Link>

              <Link to="/messages" className="group">
                <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-200 group-hover:border-purple-200">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages</h3>
                  <p className="text-gray-600 text-sm">Connect with potential candidates</p>
                </div>
              </Link>

              <Link to="/profile" className="group">
                <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-200 group-hover:border-orange-200">
                  <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                    <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Profile</h3>
                  <p className="text-gray-600 text-sm">Manage your company information</p>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* Stats & Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Activity</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">
                    {user?.role === 'student' ? 'Projects' : 'Job Posts'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">
                    {user?.role === 'student' ? 'Applications' : 'Applications Received'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">Messages</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Account created successfully</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <span>Welcome to Elevatr!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {user?.role === 'student' ? '💡 Pro Tip for Students' : '💼 Tip for Recruiters'}
              </h3>
              <p className="text-blue-100">
                {user?.role === 'student' 
                  ? 'Start by adding your first project! Showcase your best work with detailed descriptions, GitHub links, and live demos to attract recruiters.'
                  : 'Browse student projects to discover hidden talent! Look for creativity, technical skills, and passion in their work.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Landing page for non-authenticated users
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            Welcome to <span className="text-blue-200">Elevatr</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-12 leading-relaxed">
            The premier platform connecting talented students with exceptional career opportunities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center px-10 py-5 bg-white text-blue-600 font-bold text-xl rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Get Started Free
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center px-10 py-5 border-2 border-white text-white font-bold text-xl rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;