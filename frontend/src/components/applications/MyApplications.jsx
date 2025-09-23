// src/components/applications/MyApplications.jsx
import { useState, useEffect } from 'react';
import { applicationAPI } from '../../services/api';
import ApplicationCard from './ApplicationCard';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchMyApplications();
  }, [filter]);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await applicationAPI.getMyApplications(params);
      
      console.log('API Response:', response.data);
      console.log('Applications:', response.data.applications);
      
      const applications = response.data.applications || [];
      setApplications(applications);
      
      // ✅ NEW: Calculate summary from applications array
      const calculatedSummary = applications.reduce((acc, app) => {
        const status = app.status || 'applied';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {
        applied: 0,
        viewed: 0,
        shortlisted: 0,
        accepted: 0,
        rejected: 0
      });
      
      console.log('Calculated Summary:', calculatedSummary);
      setSummary(calculatedSummary);
      
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  };
  
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
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Applications</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.applied || 0}</div>
          <div className="text-sm text-blue-700">Applied</div>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{summary.viewed || 0}</div>
          <div className="text-sm text-yellow-700">Viewed</div>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{summary.shortlisted || 0}</div>
          <div className="text-sm text-purple-700">Shortlisted</div>
        </div>
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{summary.accepted || 0}</div>
          <div className="text-sm text-green-700">Accepted</div>
        </div>
        <div className="bg-red-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{summary.rejected || 0}</div>
          <div className="text-sm text-red-700">Rejected</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'applied', 'viewed', 'shortlisted', 'accepted', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? "You haven't applied to any jobs yet" 
              : `No applications with status "${filter}"`
            }
          </p>
          <a
            href="/jobs"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Browse Jobs
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => (
            <ApplicationCard key={application._id} application={application} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplications;