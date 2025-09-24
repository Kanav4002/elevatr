import { useState, useEffect } from 'react';
import { applicationAPI, aiAPI } from '../../services/api';
import InterviewQuestionsModal from '../ai/InterviewQuestionsModal';
import { format } from 'date-fns';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // AI Modal State
  const [aiModal, setAiModal] = useState({
    isOpen: false,
    loading: false,
    questions: null,
    jobTitle: '',
    company: ''
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationAPI.getMyApplications();
      setApplications(response.data.applications || []);
    } catch (error) {
      setError('Failed to fetch applications');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async (jobId, jobTitle, company) => {
    setAiModal({
      isOpen: true,
      loading: true,
      questions: null,
      jobTitle,
      company
    });

    try {
      const response = await aiAPI.generateInterviewQuestions(jobId);
      setAiModal(prev => ({
        ...prev,
        loading: false,
        questions: response.data.questions
      }));
    } catch (error) {
      console.error('Error generating questions:', error);
      setAiModal(prev => ({
        ...prev,
        loading: false,
        questions: null
      }));
    }
  };

  const closeAiModal = () => {
    setAiModal({
      isOpen: false,
      loading: false,
      questions: null,
      jobTitle: '',
      company: ''
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      reviewing: 'bg-blue-100 text-blue-800 border-blue-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            My Applications
          </h1>
          <p className="text-xl text-gray-600">
            Track your job applications and prepare for interviews
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Applications List */}
        <div className="max-w-6xl mx-auto">
          {applications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📄</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">No Applications Yet</h3>
              <p className="text-gray-600 mb-8">Start applying to jobs to see them here!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {applications.map((application) => (
                <div key={application._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-start justify-between">
                    
                    {/* Job Info */}
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <span className="text-white text-xl font-bold">
                            {application.job?.company?.charAt(0)?.toUpperCase() || 'C'}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {application.job?.title || 'Job Title'}
                          </h3>
                          <p className="text-lg text-gray-600 mb-2">
                            {application.job?.company || 'Company'}
                          </p>
                          <p className="text-gray-500 mb-4">
                            Applied on {format(new Date(application.appliedAt), 'MMM dd, yyyy')}
                          </p>
                          
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
                              {application.status?.charAt(0)?.toUpperCase() + application.status?.slice(1) || 'Pending'}
                            </span>
                            
                            {application.job?.location && (
                              <span className="text-gray-500 text-sm flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                {application.job.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleGenerateQuestions(
                          application.job._id,
                          application.job.title,
                          application.job.company
                        )}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium text-sm transition-all transform hover:scale-105 shadow-lg"
                      >
                        🤖 Generate Questions
                      </button>
                    </div>
                  </div>

                  {/* Cover Letter Preview */}
                  {application.coverLetter && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2">Cover Letter:</h4>
                      <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-lg line-clamp-3">
                        {application.coverLetter}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Questions Modal */}
      <InterviewQuestionsModal
        isOpen={aiModal.isOpen}
        onClose={closeAiModal}
        questions={aiModal.questions}
        jobTitle={aiModal.jobTitle}
        company={aiModal.company}
        loading={aiModal.loading}
      />
    </div>
  );
};

export default MyApplications;