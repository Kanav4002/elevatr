import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import { profileAPI } from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  const [showPrivateToolkit, setShowPrivateToolkit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        console.log('Fetching profile for userId:', userId);
        const response = await profileAPI.getProfile(userId);
        console.log('Profile API response:', response.data);
        
        if (response.data.success) {
          const profile = response.data.profile;
          
          // Transform API data to match component expectations
          const transformedData = {
            id: profile.id,
            name: profile.name,
            headline: profile.profile?.headline || 'Professional',
            location: profile.profile?.location || 'Location not specified',
            role: profile.role,
            profilePicture: profile.profile?.profilePicture,
            followers: profile.profile?.followersCount || 0,
            following: profile.profile?.followingCount || 0,
            isFollowing: profile.profile?.isFollowing || false,
            bio: profile.profile?.bio || 'No bio available',
            skills: profile.profile?.skills || [],
            projects: [], // Will be fetched separately if needed
            experience: profile.profile?.experience || [],
            education: profile.profile?.education || [],
            resumes: profile.privateData?.resumes || [],
            socialLinks: profile.profile?.socialLinks || {},
            isPublic: profile.profile?.isPublic !== false
          };
          
          setProfileData(transformedData);
          setIsOwnProfile(response.data.isOwnProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        console.error('Error details:', error.response?.data || error.message);
        // Set fallback data on error
        setProfileData({
          id: user?.id || '1',
          name: user?.name || 'User',
          headline: 'Professional',
          location: 'Location not specified',
          role: user?.role || 'Student',
          profilePicture: null,
          followers: 0,
          following: 0,
          isFollowing: false,
          bio: 'No bio available',
          skills: [],
          projects: [],
          experience: [],
          education: [],
          resumes: [],
          socialLinks: {},
          isPublic: true
        });
        setIsOwnProfile(!userId || userId === user?.id);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, userId]);

  const handleFollow = async () => {
    try {
      const response = await profileAPI.toggleFollow(profileData.id);
      if (response.data.success) {
        setProfileData(prev => ({
          ...prev,
          isFollowing: response.data.isFollowing,
          followers: response.data.isFollowing ? prev.followers + 1 : prev.followers - 1
        }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await profileAPI.uploadProfilePicture(formData);
      if (response.data.success) {
        setProfileData(prev => ({
          ...prev,
          profilePicture: response.data.profilePicture
        }));
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Error uploading profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('name', file.name);
      formData.append('isDefault', profileData.resumes.length === 0 ? 'true' : 'false');

      const response = await profileAPI.uploadResume(formData);
      if (response.data.success) {
        // Refresh profile data
        const profileResponse = await profileAPI.getProfile(userId);
        if (profileResponse.data.success) {
          const profile = profileResponse.data.profile;
          setProfileData(prev => ({
            ...prev,
            resumes: profile.privateData?.resumes || []
          }));
        }
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Error uploading resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSetDefaultResume = async (resumeId) => {
    try {
      const response = await profileAPI.setDefaultResume(resumeId);
      if (response.data.success) {
        setProfileData(prev => ({
          ...prev,
          resumes: prev.resumes.map(resume => ({
            ...resume,
            isDefault: resume._id === resumeId
          }))
        }));
      }
    } catch (error) {
      console.error('Error setting default resume:', error);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!jobDescription.trim()) {
      alert('Please enter a job description');
      return;
    }

    const defaultResume = profileData.resumes.find(r => r.isDefault);
    if (!defaultResume) {
      alert('Please set a default resume first');
      return;
    }

    try {
      setAnalyzing(true);
      const response = await profileAPI.analyzeResume({
        jobDescription: jobDescription.trim(),
        resumeId: defaultResume._id
      });

      if (response.data.success) {
        setAtsAnalysis(response.data.analysis);
      }
    } catch (error) {
      console.error('Error analyzing resume:', error);
      alert('Error analyzing resume. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Public Header & Identity */}
        <div className="bg-gray-800 rounded-xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            
            {/* Left Section - Profile Info */}
            <div className="flex items-center gap-6">
              {/* Profile Picture */}
              <div className="relative">
                {profileData.profilePicture ? (
                  <img 
                    src={`http://localhost:4000${profileData.profilePicture}`}
                    alt={profileData.name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                    {profileData.name.charAt(0)}
                  </div>
                )}
                {isOwnProfile && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      id="profile-picture-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="profile-picture-upload"
                      className="absolute bottom-2 right-2 bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </label>
                  </>
                )}
              </div>

              {/* Identity Block */}
              <div>
                <h1 className="text-3xl font-bold mb-2">{profileData.name}</h1>
                <p className="text-xl text-gray-300 mb-3">{profileData.headline}</p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {profileData.location}
                  </div>
                  <span className="px-3 py-1 bg-blue-600 text-blue-100 rounded-full text-sm font-medium">
                    {profileData.role}
                  </span>
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg">{profileData.followers.toLocaleString()}</div>
                    <div className="text-gray-400">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{profileData.following}</div>
                    <div className="text-gray-400">Following</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex flex-col gap-4 lg:ml-auto">
              {!isOwnProfile && (
                <div className="flex gap-3">
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                      profileData.isFollowing
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {profileData.isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                    Message
                  </button>
                </div>
              )}

              {/* Social Links */}
              <div className="flex gap-3">
                {profileData.socialLinks.linkedin && (
                  <a href={profileData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" 
                     className="p-2 bg-gray-700 rounded-lg hover:bg-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
                {profileData.socialLinks.github && (
                  <a href={profileData.socialLinks.github} target="_blank" rel="noopener noreferrer"
                     className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                )}
                {profileData.socialLinks.portfolio && (
                  <a href={profileData.socialLinks.portfolio} target="_blank" rel="noopener noreferrer"
                     className="p-2 bg-gray-700 rounded-lg hover:bg-purple-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Download Resume Button */}
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Resume
              </button>
            </div>
          </div>
        </div>

        {/* Private Career Toolkit Toggle (Only for Own Profile) */}
        {isOwnProfile && (
          <div className="mb-8">
            <div className="bg-blue-900 rounded-xl p-6 border border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Private Career Toolkit
                  </h3>
                  <p className="text-blue-200">This section is only visible to you.</p>
                </div>
                <button
                  onClick={() => setShowPrivateToolkit(!showPrivateToolkit)}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  {showPrivateToolkit ? 'Hide' : 'Show'} Toolkit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Private Career Toolkit Content */}
        {isOwnProfile && showPrivateToolkit && (
          <div className="mb-8 space-y-6">
            
            {/* Resume Manager */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resume Manager
                </h3>
                <span className="text-sm text-blue-400">AI-Powered ATS Optimizer</span>
              </div>

              {/* My Resumes */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-4">My Resumes</h4>
                <div className="space-y-3">
                  {profileData.resumes.map((resume) => (
                    <div key={resume.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <div className="font-medium">{resume.name}</div>
                          <div className="text-sm text-gray-400">Uploaded: {resume.uploadDate}</div>
                        </div>
                        {resume.isDefault && (
                          <span className="px-2 py-1 bg-green-600 text-green-100 rounded text-xs">DEFAULT</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!resume.isDefault && (
                          <button 
                            onClick={() => handleSetDefaultResume(resume._id)}
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                          >
                            Set as default
                          </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upload New Resume */}
                <div className="mt-4">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="resume-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="resume-upload"
                    className={`w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-gray-400 hover:text-blue-400 cursor-pointer ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {uploading ? 'Uploading...' : 'Upload a new version'}
                  </label>
                </div>
              </div>
            </div>

            {/* ATS Optimizer */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI-Powered ATS Optimizer
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Job Description</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Paste the job description here to get ATS optimization suggestions..."
                  />
                </div>
                <button 
                  onClick={handleAnalyzeResume}
                  disabled={analyzing || !jobDescription.trim()}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {analyzing ? 'Analyzing...' : 'Analyze & Optimize'}
                </button>

                {/* ATS Analysis Results */}
                {atsAnalysis && (
                  <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ATS Analysis Results
                    </h4>
                    
                    {/* Score */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">ATS Compatibility Score</span>
                        <span className={`text-lg font-bold ${atsAnalysis.score >= 80 ? 'text-green-400' : atsAnalysis.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {atsAnalysis.score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${atsAnalysis.score >= 80 ? 'bg-green-400' : atsAnalysis.score >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${atsAnalysis.score}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="mb-4">
                      <h5 className="font-medium mb-2">Improvement Suggestions:</h5>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {atsAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Keywords */}
                    {atsAnalysis.missingKeywords && (
                      <div>
                        <h5 className="font-medium mb-2">Missing Keywords:</h5>
                        <div className="flex flex-wrap gap-2">
                          {atsAnalysis.missingKeywords.map((keyword, index) => (
                            <span key={index} className="px-2 py-1 bg-red-600 text-red-100 rounded text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Profile Content Tabs */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-700">
            <nav className="flex">
              {['projects', 'experience', 'education'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* About Me Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">About Me</h3>
              <p className="text-gray-300 leading-relaxed">{profileData.bio}</p>
            </div>

            {/* Skills Matrix */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Skills Matrix</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {profileData.skills.map((skill, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="font-medium text-sm">{skill.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{skill.level}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'projects' && (
              <div>
                {/* Featured Projects */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">Featured Projects</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profileData.projects.filter(p => p.featured).map((project) => (
                      <div key={project.id} className="bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-colors">
                        <div className="h-48 bg-gray-600 flex items-center justify-center">
                          <span className="text-gray-400">Project Image</span>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold mb-2">{project.title}</h4>
                          <p className="text-gray-300 text-sm mb-3">{project.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {project.technologies.map((tech, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-600 text-blue-100 rounded text-xs">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Projects */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">All Projects</h3>
                  <div className="space-y-4">
                    {profileData.projects.map((project) => (
                      <div key={project.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-gray-400">IMG</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{project.title}</h4>
                            <p className="text-gray-300 text-sm mb-2">{project.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {project.technologies.map((tech, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Experience Timeline</h3>
                <div className="space-y-6">
                  {profileData.experience.map((exp) => (
                    <div key={exp.id} className="relative pl-8 border-l-2 border-blue-500">
                      <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full"></div>
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="font-semibold text-lg">{exp.title}</h4>
                        <div className="text-blue-400 font-medium">{exp.company}</div>
                        <div className="text-gray-400 text-sm mb-2">{exp.duration}</div>
                        <p className="text-gray-300">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'education' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Education History</h3>
                <div className="space-y-4">
                  {profileData.education.map((edu) => (
                    <div key={edu.id} className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold text-lg">{edu.degree}</h4>
                      <div className="text-blue-400 font-medium">{edu.institution}</div>
                      <div className="text-gray-400 text-sm">{edu.year}</div>
                      <div className="text-gray-300 mt-2">{edu.grade}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
