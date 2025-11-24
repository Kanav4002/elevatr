import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationAPI, projectAPI } from '../services/api';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  const [stats, setStats] = useState({
    applications: 0,
    projects: 0,
    messages: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated() && user) {
      fetchUserStats();
    }
  }, [isAuthenticated, user]);

  // ✅ ENHANCED: Better project fetching with more debugging
  const fetchUserStats = async () => {
    try {
      setLoading(true);

      if (user?.role === 'student') {
        let applications = [];
        let projects = [];

        // ✅ Fetch applications safely
        try {
          const appResponse = await applicationAPI.getMyApplications();
          applications = appResponse.data.applications || appResponse.data || [];
          console.log('✅ Applications fetched:', applications.length);
        } catch (error) {
          console.log('❌ Applications not available:', error.message);
        }

        // ✅ DEBUGGING: Better project fetching
        try {
          console.log('📡 Trying /projects (all projects)...');
          const allProjectsResponse = await projectAPI.getAllProjects();
          console.log('📦 Full API response:', allProjectsResponse.data);

          const allProjects = allProjectsResponse.data.projects || allProjectsResponse.data || [];
          console.log('📋 All projects count:', allProjects.length);

          if (Array.isArray(allProjects) && allProjects.length > 0) {
            const userId = user._id || user.id;
            console.log('🔍 Looking for projects by user ID:', userId);

            // ✅ LOG FIRST 2 PROJECTS COMPLETELY
            console.log('📄 First project full structure:');
            console.log(JSON.stringify(allProjects[0], null, 2));
            if (allProjects.length > 1) {
              console.log('📄 Second project full structure:');
              console.log(JSON.stringify(allProjects[1], null, 2));
            }

            // ✅ TEMPORARY: Assign ALL projects to user for testing
            console.log('🧪 TESTING: Assigning all projects to current user for debugging');
            projects = allProjects; // Temporarily assign all projects

            console.log('✅ TEMP: All projects assigned to user:', projects.length);

          } else {
            console.log('⚠️ No projects returned from API');
          }

        } catch (error) {
          console.log('❌ Projects endpoint failed:', error.message);
          projects = [];
        }

        // ✅ FORCE UPDATE: Set stats with detailed logging
        const newStats = {
          applications: Array.isArray(applications) ? applications.length : 0,
          projects: Array.isArray(projects) ? projects.length : 0,
          messages: 0
        };

        console.log('📊 BEFORE setState - Current stats:', stats);
        console.log('📊 SETTING new stats:', newStats);

        setStats(newStats);

        // ✅ Force re-render by updating key
        console.log('🔄 Stats should update now...');

        // Give React time to update
        setTimeout(() => {
          console.log('📊 AFTER setState - Stats should be:', newStats);
          console.log('📊 Actual stats state:', stats);
        }, 100);

        // ✅ Create recent activity
        const activities = [];

        // Add application activities
        if (Array.isArray(applications) && applications.length > 0) {
          applications.slice(0, 2).forEach(app => {
            activities.push({
              type: 'application',
              message: `Applied to ${app.job?.title || 'a position'} at ${app.job?.company || 'a company'}`,
              status: app.status || 'pending',
              timestamp: app.createdAt || app.appliedAt
            });
          });
        }

        // Add project activities
        if (Array.isArray(projects) && projects.length > 0) {
          projects.slice(0, 2).forEach(project => {
            activities.push({
              type: 'project',
              message: `Created project "${project.title || project.name || 'Untitled'}"`,
              status: 'created',
              timestamp: project.createdAt
            });
          });
        }

        // Add welcome message
        if (activities.length <= 2) { // Only applications, no projects
          activities.push({
            type: 'general',
            message: `Welcome ${user.name}! You have ${projects.length} projects to showcase.`,
            timestamp: user.createdAt || new Date().toISOString()
          });
        }

        // Sort by timestamp and take top 4
        activities.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        setRecentActivity(activities.slice(0, 4));

        console.log('✅ Recent activity set:', activities);

      } else {
        // Recruiter default stats
        setStats({
          applications: 0,
          projects: 0,
          messages: 0
        });

        setRecentActivity([{
          type: 'general',
          message: 'Welcome to your recruiter dashboard',
          timestamp: new Date().toISOString()
        }]);
      }

    } catch (error) {
      console.error('❌ Error fetching user stats:', error);
      setStats({ applications: 0, projects: 0, messages: 0 });
      setRecentActivity([{
        type: 'general',
        message: 'Welcome to Elevatr!',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      console.log('🏁 fetchUserStats completed');
      setLoading(false);
    }
  };

  if (!isAuthenticated()) {
    return <LandingPage />;
  }

  // Helper functions
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'User';

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Recently';

    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getActivityIconColor = (type, status) => {
    if (type === 'application') {
      if (status === 'accepted') return 'bg-green-500';
      if (status === 'rejected') return 'bg-red-500';
      if (status === 'shortlisted') return 'bg-purple-500';
      return 'bg-blue-500';
    }
    if (type === 'project') return 'bg-green-500';
    return 'bg-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {getGreeting()}, {firstName}! 👋
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 mt-1">
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
                    to="/jobs/post"
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
                  {stats.projects > 0 && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {stats.projects} project{stats.projects !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
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

              <Link to="/applications" className="group">
                <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-200 group-hover:border-orange-200">
                  <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                    <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">My Applications</h3>
                  <p className="text-gray-600 text-sm">Track your job application progress</p>
                  {stats.applications > 0 && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {stats.applications} active
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </>
          ) : (
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

              <Link to="/jobs/post" className="group">
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

              <Link to="/jobs/manage" className="group">
                <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-200 group-hover:border-purple-200">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m10-8V7a2 2 0 00-2-2h-2m4 8h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m0 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v0" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Jobs</h3>
                  <p className="text-gray-600 text-sm">Track applications and manage postings</p>
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
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Activity</h2>

              {loading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.projects}</div>
                    <div className="text-sm text-gray-600">
                      {user?.role === 'student' ? 'Projects' : 'Job Posts'}
                    </div>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.applications}</div>
                    <div className="text-sm text-gray-600">
                      {user?.role === 'student' ? 'Applications' : 'Applications Received'}
                    </div>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.messages}</div>
                    <div className="text-sm text-gray-600">Messages</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center items-center h-16">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 text-sm">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getActivityIconColor(activity.type, activity.status)}`}></div>
                    <div className="flex-1">
                      <p className="text-gray-700">{activity.message}</p>
                      <p className="text-gray-500 text-xs">{formatTimestamp(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No recent activity
                </div>
              )}
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
                  ? stats.projects > 0
                    ? `Great job on your ${stats.projects} project${stats.projects !== 1 ? 's' : ''}! ${stats.applications > 0 ? 'Keep applying to more positions and' : 'Start applying to jobs and'} showcase your work to attract recruiters.`
                    : 'Start by adding your first project! Showcase your best work with detailed descriptions, GitHub links, and live demos to attract recruiters.'
                  : 'Browse student projects to discover hidden talent! Look for creativity, technical skills, and passion in their work.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        {user?.role === 'student' ? (
          <Link
            to="/projects/new"
            className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110"
            aria-label="Add New Project"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Link>
        ) : (
          <Link
            to="/jobs/post"
            className="flex items-center justify-center w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 hover:scale-110"
            aria-label="Post New Job"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-8 animate-fade-in-down">
              <svg className="w-4 h-4 mr-2 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Trusted by 5000+ Students & 500+ Companies
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 leading-tight animate-fade-in">
              Elevate Your
              <span className="block bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Career Journey
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-12 leading-relaxed animate-fade-in-up">
              Connect with opportunities, showcase your projects, and build your future.
              Join the premier platform where talent meets opportunity.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up animation-delay-200">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center px-10 py-5 bg-white text-blue-600 font-bold text-xl rounded-2xl hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105"
              >
                Get Started Free
                <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-10 py-5 border-2 border-white text-white font-bold text-xl rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
              >
                Learn More
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-blue-100 text-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                100% Free Forever
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No Credit Card Required
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Setup in 2 Minutes
              </div>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to help you showcase your work and land your dream job
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full filter blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative">
                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Project Portfolio</h3>
                <p className="text-gray-600 leading-relaxed">
                  Showcase your best work with stunning portfolios. Add GitHub links, live demos, and detailed descriptions.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full filter blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative">
                <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM9 12l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Job Opportunities</h3>
                <p className="text-gray-600 leading-relaxed">
                  Access exclusive internships and full-time positions from top companies actively seeking talent.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full filter blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative">
                <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Network & Grow</h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect with peers, mentors, and industry professionals to accelerate your career growth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="transform hover:scale-105 transition-transform">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">5000+</div>
              <div className="text-xl text-blue-100">Active Students</div>
            </div>
            <div className="transform hover:scale-105 transition-transform">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">500+</div>
              <div className="text-xl text-blue-100">Partner Companies</div>
            </div>
            <div className="transform hover:scale-105 transition-transform">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">10k+</div>
              <div className="text-xl text-blue-100">Projects Showcased</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Join thousands of students who have already found their dream opportunities.
            Your future starts here.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xl rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Get Started Free
              <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center px-10 py-5 border-2 border-blue-600 text-blue-600 font-bold text-xl rounded-2xl hover:bg-blue-50 transition-all duration-300"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Add custom animations to index.css */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-fade-in-down {
          animation: fade-in-down 1s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};


export default HomePage;