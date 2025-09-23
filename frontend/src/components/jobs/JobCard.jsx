// src/components/JobCard.jsx
import { useState } from 'react';
import { formatDistanceToNow, isAfter } from 'date-fns';
import { MapPinIcon, BuildingOfficeIcon, ClockIcon } from '@heroicons/react/24/outline';
import JobDetailsModal from './JobDetailsModal';

const JobCard = ({ job }) => {
  const [showDetails, setShowDetails] = useState(false);

  const isDeadlinePassed = !isAfter(new Date(job.deadline), new Date());
  const daysUntilDeadline = formatDistanceToNow(new Date(job.deadline), { addSuffix: true });

  const getDeadlineColor = () => {
    const daysLeft = (new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24);
    if (isDeadlinePassed) return 'text-red-600 bg-red-100';
    if (daysLeft <= 3) return 'text-orange-600 bg-orange-100';
    if (daysLeft <= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-800 line-clamp-2">
            {job.title}
          </h3>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
            {job.type}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <BuildingOfficeIcon className="h-4 w-4 mr-2" />
            <span className="text-sm">{job.company}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-2" />
            <span className="text-sm">{job.location}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <ClockIcon className="h-4 w-4 mr-2" />
            <span className="text-sm">Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {job.description}
        </p>

        {job.skills && job.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {job.skills.slice(0, 3).map((skill, index) => (
                <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                  {skill}
                </span>
              ))}
              {job.skills.length > 3 && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                  +{job.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDeadlineColor()}`}>
            {isDeadlinePassed ? 'Deadline passed' : `Apply ${daysUntilDeadline}`}
          </span>
          <button
            onClick={() => setShowDetails(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Details
          </button>
        </div>
      </div>

      {showDetails && (
        <JobDetailsModal 
          job={job} 
          onClose={() => setShowDetails(false)} 
        />
      )}
    </>
  );
};

export default JobCard;