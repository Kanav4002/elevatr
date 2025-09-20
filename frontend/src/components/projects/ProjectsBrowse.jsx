import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProjectsBrowse = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [availableTech, setAvailableTech] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, selectedTech]);

  // 🔧 FIXED FETCH FUNCTION
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:4000/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Fetched projects:', data);
  
      // 🔧 FIX: Check for different response structures
      let projectsArray = [];
      
      if (data.success && data.projects) {
        // Structure: { success: true, projects: [...] }
        projectsArray = data.projects;
      } else if (data.success && data.message && data.message.includes('successfully')) {
        // Handle case where projects might be in a different field
        projectsArray = data.data || data.result || [];
      } else if (Array.isArray(data)) {
        // Direct array response
        projectsArray = data;
      } else if (data.projects && Array.isArray(data.projects)) {
        // Just projects array
        projectsArray = data.projects;
      } else {
        console.log('Unexpected response structure:', data);
        setError('Unexpected response format from server');
        return;
      }
  
      console.log('Projects array:', projectsArray);
  
      // Filter projects based on user role
      let projectsToShow = projectsArray;
      
      // If user is recruiter, only show public projects
      if (user?.role === 'recruiter') {
        projectsToShow = projectsToShow.filter(project => project.isPublic === true);
      }
      
      setProjects(projectsToShow);
      
      // Extract unique technologies
      const techSet = new Set();
      projectsToShow.forEach(project => {
        if (project.techStack && Array.isArray(project.techStack)) {
          project.techStack.forEach(tech => {
            if (tech && typeof tech === 'string') {
              techSet.add(tech);
            }
          });
        }
      });
      setAvailableTech(Array.from(techSet).sort());
  
      // Clear any previous errors
      setError('');
  
    } catch (error) {
      console.error('Error fetching projects:', error);
      
      // 🔧 BETTER ERROR HANDLING
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Cannot connect to server. Make sure the backend is running on port 4000.');
      } else if (error.message.includes('401')) {
        setError('Authentication failed. Please login again.');
      } else if (error.message.includes('403')) {
        setError('Access denied. Please check your permissions.');
      } else {
        setError(`Failed to load projects: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔧 FIXED FILTER FUNCTION
  const filterProjects = () => {
    if (!Array.isArray(projects)) {
      setFilteredProjects([]);
      return;
    }

    let filtered = [...projects]; // 🔧 CREATE COPY TO AVOID MUTATION

    // Filter by search term (title or description)
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(project => {
        const title = project.title || '';
        const description = project.description || '';
        return title.toLowerCase().includes(searchLower) ||
               description.toLowerCase().includes(searchLower);
      });
    }

    // Filter by selected technology
    if (selectedTech) {
      filtered = filtered.filter(project => {
        return project.techStack && 
               Array.isArray(project.techStack) && 
               project.techStack.includes(selectedTech);
      });
    }

    setFilteredProjects(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTech('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading projects...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Connection Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-2">
            <p className="text-sm text-red-600">
              Make sure your backend server is running:
            </p>
            <code className="block bg-red-100 text-red-800 p-2 rounded text-sm">
              cd backend && npm run dev
            </code>
          </div>
          <button
            onClick={fetchProjects}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Browse Projects</h1>
        <p className="text-gray-600">
          Discover amazing projects from talented students
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Projects
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Technology Filter */}
          <div className="md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Technology
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
            >
              <option value="">All Technologies</option>
              {availableTech.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedTech) && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {(searchTerm || selectedTech) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-600"
                  aria-label="Clear search"
                >
                  ×
                </button>
              </span>
            )}
            {selectedTech && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Tech: {selectedTech}
                <button
                  onClick={() => setSelectedTech('')}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:text-green-600"
                  aria-label="Clear technology filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-gray-600">
          {filteredProjects.length === projects.length 
            ? `Showing all ${projects.length} project${projects.length !== 1 ? 's' : ''}`
            : `Found ${filteredProjects.length} of ${projects.length} projects`
          }
        </p>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
              {/* Project Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                <Link 
                  to={`/projects/${project._id}`}
                  className="text-lg font-semibold text-gray-800 flex-1 mr-2 hover:text-blue-600 transition duration-200"
                >
                  {project.title || 'Untitled Project'}
                </Link>
                  {project.isPublic && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full flex-shrink-0">
                      Public
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {project.description || 'No description available'}
                </p>

                {/* Tech Stack */}
                {project.techStack && project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.techStack.slice(0, 3).map((tech, index) => (
                      <span
                        key={`${project._id}-tech-${index}`} // 🔧 UNIQUE KEY
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-md"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                        +{project.techStack.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Author Info */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-white text-xs font-semibold">
                      {project.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="truncate">by {project.user?.name || 'Unknown'}</span>
                  <span className="mx-2 flex-shrink-0">•</span>
                  <span className="flex-shrink-0">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Action Links */}
                <div className="flex gap-3">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition duration-200"
                    >
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      GitHub
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-gray-600 hover:text-green-600 transition duration-200"
                    >
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Live Demo
                    </a>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Link to={`/projects/${project._id}`} className="...">
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* No Results */
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedTech 
              ? "Try adjusting your search criteria"
              : "No projects available yet"
            }
          </p>
          {(searchTerm || selectedTech) && (
            <button
              onClick={clearFilters}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsBrowse;