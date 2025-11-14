import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu on window resize (when switching to desktop view)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('nav')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
              Elevatr
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              {isAuthenticated() ? (
                // Authenticated Navigation
                <>
                  <Link 
                    to="/" 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-200"
                  >
                    Dashboard
                  </Link>
                  
                  {/* 🆕 ADD BROWSE PROJECTS LINK */}
                  <Link 
                    to="/projects/browse" 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-200"
                  >
                    Browse Projects
                  </Link>
                  
                  {/* Add Projects link for students */}
                  {user?.role === 'student' && (
                    <Link 
                      to="/projects/my" 
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-200"
                    >
                      My Projects
                    </Link>
                  )}
                  
                  <Link 
                    to={user?.role === 'recruiter' ? '/jobs/manage' : '/jobs'} 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-200"
                  >
                    {user?.role === 'recruiter' ? 'Manage Jobs' : 'Find Jobs'}
                  </Link>

                  {user?.role === 'student' && (
                    <Link 
                      to="/applications" 
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-200"
                    >
                      Applications
                    </Link>
                  )}
                  
                  <Link 
                    to="/members" 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-200"
                  >
                    Members
                  </Link>

                  <Link 
                    to="/messages" 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-200"
                  >
                    Messages
                  </Link>

                  {/* Notification Bell */}
                  <NotificationBell />

                  {/* ...existing user dropdown... */}
                  <div className="relative">
                    <button
                      onClick={toggleDropdown}
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition duration-200"
                    >
                      {/* Clean Profile Avatar */}
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <span className="text-white font-semibold text-sm">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      {/* User Name */}
                      <span className="text-sm font-medium">
                        {user?.name?.split(' ')[0]} {/* Only first name */}
                      </span>
                      
                      {/* Dropdown Arrow */}
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* ...rest of existing dropdown menu... */}
                    {isDropdownOpen && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsDropdownOpen(false)}
                        ></div>
                        
                        {/* Dropdown */}
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                          {/* User Info Header */}
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {user?.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                                <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
                                  {user?.role}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-2">
                            <Link
                              to="/profile"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition duration-200"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              My Profile
                            </Link>
                            
                            {user?.role === 'student' && (
                              <Link
                                to="/projects/my"
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition duration-200"
                                onClick={() => setIsDropdownOpen(false)}
                              >
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                My Projects
                              </Link>
                            )}
                            
                            <Link
                              to="/settings"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition duration-200"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Settings
                            </Link>
                          </div>

                          {/* Logout Section */}
                          <div className="border-t border-gray-200 py-2">
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition duration-200"
                            >
                              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Logout
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                // Unauthenticated Navigation  
                <>
                  <Link 
                    to="/" 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-200"
                  >
                    Home
                  </Link>
                  
                  <Link 
                    to="/about" 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-200"
                  >
                    About
                  </Link>
                  
                  <Link
                    to="/login"
                    className="text-blue-600 hover:text-blue-700 px-3 py-2 text-sm font-medium border border-blue-600 rounded-md hover:bg-blue-50 transition duration-200"
                  >
                    Login
                  </Link>
                  
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-medium rounded-md transition duration-200"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <input 
              id="mobile-toggle" 
              type="checkbox" 
              className="hidden"
              checked={isMobileMenuOpen}
              onChange={toggleMobileMenu}
            />
            <label 
              htmlFor="mobile-toggle" 
              className="hamburger-menu cursor-pointer block relative w-10 h-10 z-50"
              aria-label="Toggle mobile menu"
            >
              <div className={`hamburger-line top ${isMobileMenuOpen ? 'active' : ''}`}></div>
              <div className={`hamburger-line middle ${isMobileMenuOpen ? 'active' : ''}`}></div>
              <div className={`hamburger-line bottom ${isMobileMenuOpen ? 'active' : ''}`}></div>
            </label>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <div className={`mobile-dropdown-menu md:hidden overflow-hidden ${isMobileMenuOpen ? 'open' : 'closed'}`}>
        <div className="bg-blue-900 shadow-xl">
          {isAuthenticated() ? (
            // Authenticated Mobile Navigation
            <div>
                <Link 
                  to="/" 
                  className="mobile-menu-link"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
                
                <Link 
                  to="/projects/browse" 
                  className="mobile-menu-link"
                  onClick={closeMobileMenu}
                >
                  Browse Projects
                </Link>
                
                {user?.role === 'student' && (
                  <Link 
                    to="/projects/my" 
                    className="mobile-menu-link"
                    onClick={closeMobileMenu}
                  >
                    My Projects
                  </Link>
                )}
                
                <Link 
                  to={user?.role === 'recruiter' ? '/jobs/manage' : '/jobs'} 
                  className="mobile-menu-link"
                  onClick={closeMobileMenu}
                >
                  {user?.role === 'recruiter' ? 'Manage Jobs' : 'Find Jobs'}
                </Link>

                {user?.role === 'student' && (
                  <Link 
                    to="/applications" 
                    className="mobile-menu-link"
                    onClick={closeMobileMenu}
                  >
                    Applications
                  </Link>
                )}
                
                <Link 
                  to="/members" 
                  className="mobile-menu-link"
                  onClick={closeMobileMenu}
                >
                  Members
                </Link>

                <Link 
                  to="/messages" 
                  className="mobile-menu-link"
                  onClick={closeMobileMenu}
                >
                  Messages
                </Link>

                <Link
                  to="/profile"
                  className="mobile-menu-link"
                  onClick={closeMobileMenu}
                >
                  My Profile
                </Link>
                
                <Link
                  to="/settings"
                  className="mobile-menu-link"
                  onClick={closeMobileMenu}
                >
                  Settings
                </Link>

                <button
                  onClick={handleLogout}
                  className="mobile-menu-link text-red-300 hover:text-red-100 hover:bg-red-800"
                >
                  Logout
                </button>
            </div>
          ) : (
            // Unauthenticated Mobile Navigation  
            <div>
              <Link 
                to="/" 
                className="mobile-menu-link"
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              
              <Link 
                to="/about" 
                className="mobile-menu-link"
                onClick={closeMobileMenu}
              >
                About
              </Link>
              
              <Link
                to="/login"
                className="mobile-menu-link"
                onClick={closeMobileMenu}
              >
                Login
              </Link>
              
              <Link
                to="/register"
                className="mobile-menu-link bg-blue-700 hover:bg-blue-600 font-semibold"
                onClick={closeMobileMenu}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;