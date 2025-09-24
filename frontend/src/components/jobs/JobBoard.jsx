import { useState, useEffect } from 'react';
import { jobAPI } from '../../services/api';
import JobCard from './JobCard';
import { XMarkIcon, MagnifyingGlassIcon, MapPinIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

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

  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      type: '',
      page: 1
    });
    
    const form = document.getElementById('search-form');
    if (form) {
      form.reset();
    }
  };

  const hasActiveFilters = filters.search || filters.location || filters.type;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-96">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BriefcaseIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-xl">
            <BriefcaseIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Find Your Dream Job
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing opportunities from top companies. Your next career move starts here.
          </p>
        </div>
        
        {/* Enhanced Search Form */}
        <div className="max-w-6xl mx-auto mb-12">
          <form 
            id="search-form" 
            onSubmit={handleSearch} 
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    placeholder="Job title or keywords..."
                    defaultValue={filters.search}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg"
                  />
                </div>

                {/* Location Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="location"
                    placeholder="City, state, or remote..."
                    defaultValue={filters.location}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg"
                  />
                </div>

                {/* Job Type Select */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="type"
                    defaultValue={filters.type}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg appearance-none bg-white"
                  >
                    <option value="">All Job Types</option>
                    <option value="full-time">💼 Full Time</option>
                    <option value="part-time">⏰ Part Time</option>
                    <option value="internship">🎓 Internship</option>
                    <option value="contract">📄 Contract</option>
                    <option value="remote">🏠 Remote</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    🔍 Search Jobs
                  </button>
                  
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="px-4 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 flex items-center justify-center group"
                      title="Clear all filters"
                    >
                      <XMarkIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-gray-800">Active Filters:</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      🔍 "{filters.search}"
                    </span>
                  )}
                  
                  {filters.location && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      📍 "{filters.location}"
                    </span>
                  )}
                  
                  {filters.type && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                      💼 {filters.type.charAt(0).toUpperCase() + filters.type.slice(1).replace('-', ' ')}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                >
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  Clear all
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-red-800 font-medium text-lg">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} Found
                  </p>
                  {hasActiveFilters && (
                    <p className="text-blue-600 font-medium">
                      Showing filtered results
                    </p>
                  )}
                </div>
              </div>
              
              {jobs.length > 0 && (
                <div className="text-right">
                  <p className="text-gray-600">
                    Updated just now
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Jobs Grid or Empty State */}
        <div className="max-w-6xl mx-auto">
          {jobs.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-8">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {hasActiveFilters ? 'No Matching Jobs Found' : 'No Jobs Available'}
              </h3>
              
              <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                {hasActiveFilters 
                  ? "We couldn't find any jobs matching your search criteria. Try adjusting your filters." 
                  : "No job opportunities are currently available. Check back soon for new postings!"
                }
              </p>
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <XMarkIcon className="w-5 h-5 mr-2" />
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* Load More Section (if pagination needed) */}
        {jobs.length > 0 && (
          <div className="max-w-6xl mx-auto mt-16 text-center">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Looking for more opportunities?
              </h3>
              <p className="text-gray-600 mb-6">
                We're constantly adding new job postings from amazing companies.
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 rounded-xl font-semibold text-lg transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l3-3m0 0l3 3m-3-3v6m0-6V4" />
                </svg>
                Back to Top
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobBoard;