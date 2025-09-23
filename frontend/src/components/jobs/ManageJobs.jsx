import { useState, useEffect } from 'react';
import { jobAPI } from '../../services/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyJobs();
    
    // Check for success message from posting
    if (location.state?.message) {
      setMessage(location.state.message);
      setTimeout(() => setMessage(''), 5000);
    }

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMyJobs, 30000);
    
    return () => clearInterval(interval);
  }, [location]);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await jobAPI.getMyJobs();
      console.log('Fetched jobs response:', response.data);
      
      // Handle different response structures
      let jobsData = response.data.jobs || response.data || [];
      
      // ✅ NEW: Fetch application count for each job
      if (Array.isArray(jobsData)) {
        jobsData = await Promise.all(jobsData.map(async (job) => {
          try {
            const applicantsResponse = await jobAPI.getJobApplicants(job._id);
            const applicantsData = applicantsResponse.data.applicants || 
                                   applicantsResponse.data.applications || 
                                   applicantsResponse.data || 
                                   [];
            return {
              ...job,
              applicantCount: Array.isArray(applicantsData) ? applicantsData.length : 0,
              applicants: applicantsData
            };
          } catch (error) {
            console.warn(`Failed to fetch applicants for job ${job._id}:`, error);
            return { ...job, applicantCount: 0, applicants: [] };
          }
        }));
      }
      
      console.log('Enhanced jobs data:', jobsData);
      setJobs(jobsData);
      
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError(error.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ UPDATE: Reduce auto-refresh frequency to avoid spam
  useEffect(() => {
    fetchMyJobs();
    
    if (location.state?.message) {
      setMessage(location.state.message);
      setTimeout(() => setMessage(''), 5000);
    }
  
    // Auto-refresh every 60 seconds instead of 30
    const interval = setInterval(fetchMyJobs, 60000);
    
    return () => clearInterval(interval);
  }, [location]);

  // Function to refresh job data
  const refreshJobData = async () => {
    await fetchMyJobs();
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await jobAPI.deleteJob(jobId);
      setJobs(jobs.filter(job => job._id !== jobId));
      setMessage('Job deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting job:', error);
      setError('Failed to delete job');
    }
  };

  const handleViewApplicants = (jobId) => {
    navigate(`/jobs/${jobId}/applicants`);
  };

  const handleEditJob = (jobId) => {
    navigate(`/jobs/${jobId}/edit`);
  };

  const getStatusColor = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return 'text-red-600 bg-red-100';
    if (daysLeft <= 7) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Jobs</h1>
          <p className="text-gray-600">Manage your job postings and track applications</p>
        </div>
        <Link
          to="/jobs/post"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Post New Job
        </Link>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
          <div className="text-sm text-gray-600">Total Jobs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-green-600">
            {jobs.filter(job => new Date(job.deadline) > new Date()).length}
          </div>
          <div className="text-sm text-gray-600">Active Jobs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">
            {jobs.filter(job => new Date(job.deadline) <= new Date()).length}
          </div>
          <div className="text-sm text-gray-600">Expired Jobs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-purple-600">
            {jobs.reduce((sum, job) => {
              const count = job.applicants?.length || 
                           job.applicationCount || 
                           job.applications?.length || 
                           0;
              return sum + count;
            }, 0)}
          </div>
          <div className="text-sm text-gray-600">
            Total Applications
            <button 
              onClick={refreshJobData}
              className="ml-2 text-xs text-blue-600 hover:text-blue-800"
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM9 12l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Posted Yet</h3>
          <p className="text-gray-500 mb-6">Start by posting your first job to attract talented candidates</p>
          <Link
            to="/jobs/post"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{job.title}</h3>
                  <div className="text-gray-600 text-sm space-y-1">
                    <p>🏢 {job.company}</p>
                    <p>📍 {job.location}</p>
                    <p>📅 Posted {formatDate(job.createdAt)}</p>
                    <p>⏰ Deadline: {formatDate(job.deadline)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.deadline)}`}>
                    {new Date(job.deadline) > new Date() ? 'Active' : 'Expired'}
                  </span>
                  <button 
                    onClick={refreshJobData}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600"
                    title="Refresh counts"
                  >
                    {job.applicants?.length || job.applicationCount || job.applications?.length || 0} applications
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex space-x-2">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                    {job.type?.replace('-', ' ') || 'Full Time'}
                  </span>
                  {job.skills && job.skills.slice(0, 3).map((skill, index) => (
                    <span key={index} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                  {job.skills && job.skills.length > 3 && (
                    <span className="text-xs text-gray-500 py-1">
                      +{job.skills.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewApplicants(job._id)}
                    className="inline-flex items-center px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    title="View Applicants"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Applicants ({job.applicants?.length || job.applicationCount || job.applications?.length || 0})
                  </button>
                  <button
                    onClick={() => handleEditJob(job._id)}
                    className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                    title="Edit Job"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job._id)}
                    className="inline-flex items-center px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Job"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageJobs;