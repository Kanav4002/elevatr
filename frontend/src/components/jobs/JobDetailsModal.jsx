// src/components/jobs/JobDetailsModal.jsx
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { applicationAPI } from '../../services/api';
import { isAfter, format } from 'date-fns';

const JobDetailsModal = ({ job, onClose }) => {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Get user from localStorage (simple approach)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  
  const isDeadlinePassed = !isAfter(new Date(job.deadline), new Date());
  const isStudent = user?.role === 'student';
  const isLoggedIn = !!token;

  const handleApply = async (e) => {
    e.preventDefault();
    if (coverLetter.length < 50) {
      setMessage({ type: 'error', text: 'Cover letter must be at least 50 characters long' });
      return;
    }

    try {
      setLoading(true);
      await applicationAPI.applyForJob(job._id, { coverLetter });
      setMessage({ type: 'success', text: 'Application submitted successfully!' });
      setShowApplicationForm(false);
      setCoverLetter('');
      
      // Auto close success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to submit application' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{job.title}</h2>
              <p className="text-lg text-gray-600">{job.company}</p>
              <p className="text-gray-500">{job.location}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`mb-4 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Job Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Job Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Job Type</h4>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                  {job.type}
                </span>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Application Deadline</h4>
                <p className={`text-sm ${isDeadlinePassed ? 'text-red-600' : 'text-gray-700'}`}>
                  {format(new Date(job.deadline), 'PPP')}
                  {isDeadlinePassed && ' (Expired)'}
                </p>
              </div>
            </div>

            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Requirements</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {job.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {job.skills && job.skills.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Application Section */}
          <div className="mt-8 pt-6 border-t">
            {!isLoggedIn ? (
              <p className="text-gray-500">Please login to apply for this job.</p>
            ) : !isStudent ? (
              <p className="text-gray-500">Only students can apply for jobs.</p>
            ) : isDeadlinePassed ? (
              <button disabled className="w-full py-3 px-4 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed">
                Application Deadline Passed
              </button>
            ) : !showApplicationForm ? (
              <button
                onClick={() => setShowApplicationForm(true)}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Apply for this Job
              </button>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter *
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {coverLetter.length}/50 characters minimum
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || coverLetter.length < 50}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors font-medium"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;