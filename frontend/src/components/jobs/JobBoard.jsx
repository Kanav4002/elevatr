import { useState, useEffect } from 'react';
import { jobAPI } from '../../services/api';
import JobCard from './JobCard';
import { XMarkIcon } from '@heroicons/react/24/outline';

const JobBoard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    type: '',
    page: 1
  });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobAPI.getAllJobs(filters);
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to fetch jobs. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setFilters({
      ...filters,
      search: formData.get('search') || '',
      location: formData.get('location') || '',
      type: formData.get('type') || '',
      page: 1
    });
  };

  // ✅ NEW: Clear all filters function
  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      type: '',
      page: 1
    });
    
    // Clear the form inputs
    const form = document.getElementById('search-form');
    if (form) {
      form.reset();
    }
  };

  // ✅ NEW: Check if any filters are active
  const hasActiveFilters = filters.search || filters.location || filters.type;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Find Your Dream Job</h1>
        
        {/* Search Form */}
        <form 
          id="search-form" 
          onSubmit={handleSearch} 
          className="bg-white p-6 rounded-lg shadow-md mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                name="search"
                placeholder="Search jobs..."
                defaultValue={filters.search}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <input
                type="text"
                name="location"
                placeholder="Location..."
                defaultValue={filters.location}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                name="type"
                defaultValue={filters.type}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Search Jobs
              </button>
              
              {/* ✅ NEW: Clear button - only show when filters are active */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
                  title="Clear all filters"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>
        </form>

        {/* ✅ NEW: Active filters display */}
        {hasActiveFilters && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-sm font-medium text-blue-800">Active Filters:</span>
              
              {filters.search && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{filters.search}"
                </span>
              )}
              
              {filters.location && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Location: "{filters.location}"
                </span>
              )}
              
              {filters.type && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Type: {filters.type.charAt(0).toUpperCase() + filters.type.slice(1).replace('-', ' ')}
                </span>
              )}
              
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 underline"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-6">
        <p className="text-gray-600">
          Found {jobs.length} jobs
          {hasActiveFilters && (
            <span className="text-blue-600 ml-2">
              (filtered results)
            </span>
          )}
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-500 mb-4">
            {hasActiveFilters 
              ? "No jobs match your current filters. Try adjusting your search criteria." 
              : "No jobs are currently available."
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobBoard;