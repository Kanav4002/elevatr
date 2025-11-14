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
  
  // Edit states
  const [editMode, setEditMode] = useState({
    about: false,
    skills: false,
    experience: false,
    education: false
  });
  const [editData, setEditData] = useState({
    bio: '',
    skills: [],
    experience: [],
    education: []
  });

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
                   followersCount: profile.profile?.followersCount || 0,
                   followingCount: profile.profile?.followingCount || 0,
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
                 followersCount: 0,
                 followingCount: 0,
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
          followersCount: response.data.followersCount,
          followingCount: response.data.followingCount
        }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleDownloadResume = async (resumeId, resumeName) => {
    try {
      setUploading(true);
      const response = await profileAPI.downloadResume(resumeId);
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename
      link.setAttribute('download', resumeName || 'resume.pdf');
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading resume:', error);
      alert('Error downloading resume. Please try again.');
    } finally {
      setUploading(false);
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

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    try {
      const response = await profileAPI.deleteResume(resumeId);
      if (response.data.success) {
        setProfileData(prev => ({
          ...prev,
          resumes: prev.resumes.filter(resume => resume._id !== resumeId)
        }));
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Error deleting resume. Please try again.');
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

  // Edit handlers
  const toggleEditMode = (section) => {
    setEditMode(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    
    // Initialize edit data when entering edit mode
    if (!editMode[section]) {
      switch (section) {
        case 'about':
          setEditData(prev => ({ ...prev, bio: profileData.bio || '' }));
          break;
        case 'skills':
          setEditData(prev => ({ ...prev, skills: [...(profileData.skills || [])] }));
          break;
        case 'experience':
          setEditData(prev => ({ ...prev, experience: [...(profileData.experience || [])] }));
          break;
        case 'education':
          setEditData(prev => ({ ...prev, education: [...(profileData.education || [])] }));
          break;
      }
    }
  };

  const saveSection = async (section) => {
    try {
      const updateData = {};
      
      switch (section) {
        case 'about':
          updateData.bio = editData.bio;
          break;
        case 'skills':
          updateData.skills = editData.skills;
          break;
        case 'experience':
          updateData.experience = editData.experience;
          break;
        case 'education':
          updateData.education = editData.education;
          break;
      }

      const response = await profileAPI.updateProfile(updateData);
      if (response.data.success) {
        // Update profile data
        setProfileData(prev => ({
          ...prev,
          ...updateData
        }));
        
        // Exit edit mode
        setEditMode(prev => ({ ...prev, [section]: false }));
      }
    } catch (error) {
      console.error(`Error updating ${section}:`, error);
      alert(`Error updating ${section}. Please try again.`);
    }
  };

  const addSkill = () => {
    setEditData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: '', level: 'Beginner' }]
    }));
  };

  const removeSkill = (index) => {
    setEditData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const updateSkill = (index, field, value) => {
    setEditData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      )
    }));
  };

  const addExperience = () => {
    setEditData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        title: '',
        company: '',
        duration: '',
        description: '',
        current: false
      }]
    }));
  };

  const removeExperience = (index) => {
    setEditData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const updateExperience = (index, field, value) => {
    setEditData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addEducation = () => {
    setEditData(prev => ({
      ...prev,
      education: [...prev.education, {
        degree: '',
        institution: '',
        year: '',
        grade: ''
      }]
    }));
  };

  const removeEducation = (index) => {
    setEditData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index, field, value) => {
    setEditData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
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
                    <div className="font-bold text-lg">{(profileData.followersCount || 0).toLocaleString()}</div>
                    <div className="text-gray-400">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{(profileData.followingCount || 0).toLocaleString()}</div>
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
                        <button 
                          onClick={() => handleDownloadResume(resume._id, resume.name)}
                          disabled={uploading}
                          className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded transition-colors flex items-center gap-1"
                          title="Download Resume"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </button>
                        {!resume.isDefault && (
                          <button 
                            onClick={() => handleSetDefaultResume(resume._id)}
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                          >
                            Set as default
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteResume(resume._id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Resume"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  {analyzing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      AI Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Analyze & Optimize
                    </>
                  )}
                </button>

                {/* AI-Powered ATS Analysis Results */}
                {atsAnalysis && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg border border-gray-600">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI-Powered ATS Analysis Results
                      <span className="text-xs bg-purple-600 px-2 py-1 rounded-full">Gemini AI</span>
                    </h4>
                    
                    {/* Score */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">ATS Compatibility Score</span>
                        <span className={`text-2xl font-bold ${atsAnalysis.score >= 80 ? 'text-green-400' : atsAnalysis.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {atsAnalysis.score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${atsAnalysis.score >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' : atsAnalysis.score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                          style={{ width: `${atsAnalysis.score}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Poor Match</span>
                        <span>Perfect Match</span>
                      </div>
                    </div>

                    {/* Overall Feedback */}
                    {atsAnalysis.overallFeedback && (
                      <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                        <h5 className="font-medium mb-2 text-blue-300 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          AI Assessment
                        </h5>
                        <p className="text-sm text-gray-300 leading-relaxed">{atsAnalysis.overallFeedback}</p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Strengths */}
                      {atsAnalysis.strengths && atsAnalysis.strengths.length > 0 && (
                        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                          <h5 className="font-medium mb-3 text-green-300 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Your Strengths
                          </h5>
                          <ul className="space-y-2 text-sm text-gray-300">
                            {atsAnalysis.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-400 mt-1">✓</span>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Areas for Improvement */}
                      {atsAnalysis.weaknesses && atsAnalysis.weaknesses.length > 0 && (
                        <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
                          <h5 className="font-medium mb-3 text-orange-300 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            Areas to Improve
                          </h5>
                          <ul className="space-y-2 text-sm text-gray-300">
                            {atsAnalysis.weaknesses.map((weakness, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-orange-400 mt-1">!</span>
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* AI Suggestions */}
                    <div className="mt-6 bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
                      <h5 className="font-medium mb-3 text-purple-300 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Recommendations
                      </h5>
                      <ul className="space-y-2 text-sm text-gray-300">
                        {atsAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">→</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Keywords Analysis */}
                    <div className="mt-6 grid md:grid-cols-2 gap-4">
                      {/* Matched Keywords */}
                      {atsAnalysis.matchedKeywords && atsAnalysis.matchedKeywords.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2 text-green-300">Matched Keywords:</h5>
                          <div className="flex flex-wrap gap-2">
                            {atsAnalysis.matchedKeywords.map((keyword, index) => (
                              <span key={index} className="px-2 py-1 bg-green-600 text-green-100 rounded text-xs">
                                ✓ {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Keywords */}
                      {atsAnalysis.missingKeywords && atsAnalysis.missingKeywords.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2 text-red-300">Missing Keywords:</h5>
                          <div className="flex flex-wrap gap-2">
                            {atsAnalysis.missingKeywords.map((keyword, index) => (
                              <span key={index} className="px-2 py-1 bg-red-600 text-red-100 rounded text-xs">
                                + {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Analysis Stats */}
                    {(atsAnalysis.totalKeywords || atsAnalysis.matchedCount) && (
                      <div className="mt-6 pt-4 border-t border-gray-600">
                        <div className="flex justify-between text-sm text-gray-400">
                          <span>Keywords Matched: {atsAnalysis.matchedCount || 0}</span>
                          <span>Total Keywords: {atsAnalysis.totalKeywords || 0}</span>
                          <span>Match Rate: {atsAnalysis.totalKeywords ? Math.round((atsAnalysis.matchedCount / atsAnalysis.totalKeywords) * 100) : 0}%</span>
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">About Me</h3>
                {isOwnProfile && (
                  <button
                    onClick={() => editMode.about ? saveSection('about') : toggleEditMode('about')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                  >
                    {editMode.about ? 'Save' : 'Edit'}
                  </button>
                )}
              </div>
              
              {editMode.about ? (
                <div className="space-y-4">
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself, your goals, and what makes you unique..."
                    className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveSection('about')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => toggleEditMode('about')}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-300 leading-relaxed">
                  {profileData.bio || 'No bio available'}
                </p>
              )}
            </div>

            {/* Skills Matrix */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Skills Matrix</h3>
                {isOwnProfile && (
                  <button
                    onClick={() => editMode.skills ? saveSection('skills') : toggleEditMode('skills')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                  >
                    {editMode.skills ? 'Save' : 'Edit'}
                  </button>
                )}
              </div>
              
              {editMode.skills ? (
                <div className="space-y-4">
                  {editData.skills.map((skill, index) => (
                    <div key={index} className="flex gap-3 items-center bg-gray-700 rounded-lg p-3">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => updateSkill(index, 'name', e.target.value)}
                        placeholder="Skill name"
                        className="flex-1 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      />
                      <select
                        value={skill.level}
                        onChange={(e) => updateSkill(index, 'level', e.target.value)}
                        className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                      <button
                        onClick={() => removeSkill(index)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={addSkill}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                    >
                      Add Skill
                    </button>
                    <button
                      onClick={() => saveSection('skills')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => toggleEditMode('skills')}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {profileData.skills.length > 0 ? profileData.skills.map((skill, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3 text-center">
                      <div className="font-medium text-sm">{skill.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{skill.level}</div>
                    </div>
                  )) : (
                    <div className="col-span-full text-gray-400 text-center py-8">
                      No skills added yet
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'projects' && (
              <div>
                {/* Featured Projects */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">Featured Projects</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(profileData.projects || []).filter(p => p.featured).map((project) => (
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
                    {(!profileData.projects || profileData.projects.length === 0) && (
                      <div className="col-span-full text-gray-400 text-center py-8">
                        No featured projects yet. {isOwnProfile && 'Add some projects to showcase your work!'}
                      </div>
                    )}
                  </div>
                </div>

                {/* All Projects */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">All Projects</h3>
                  <div className="space-y-4">
                    {(profileData.projects || []).map((project) => (
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
                    {(!profileData.projects || profileData.projects.length === 0) && (
                      <div className="text-gray-400 text-center py-8">
                        No projects yet. {isOwnProfile && 'Start adding your projects to build your portfolio!'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Experience Timeline</h3>
                  {isOwnProfile && (
                    <button
                      onClick={() => editMode.experience ? saveSection('experience') : toggleEditMode('experience')}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                    >
                      {editMode.experience ? 'Save' : 'Edit'}
                    </button>
                  )}
                </div>
                
                {editMode.experience ? (
                  <div className="space-y-4">
                    {editData.experience.map((exp, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-lg">Experience {index + 1}</h4>
                          <button
                            onClick={() => removeExperience(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => updateExperience(index, 'title', e.target.value)}
                            placeholder="Job Title"
                            className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperience(index, 'company', e.target.value)}
                            placeholder="Company Name"
                            className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        
                        <input
                          type="text"
                          value={exp.duration}
                          onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                          placeholder="Duration (e.g., Jan 2020 - Present)"
                          className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        />
                        
                        <textarea
                          value={exp.description}
                          onChange={(e) => updateExperience(index, 'description', e.target.value)}
                          placeholder="Describe your role, responsibilities, and achievements..."
                          className="w-full h-24 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
                        />
                        
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-gray-300">Currently working here</span>
                        </label>
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={addExperience}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                      >
                        Add Experience
                      </button>
                      <button
                        onClick={() => saveSection('experience')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => toggleEditMode('experience')}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {profileData.experience.length > 0 ? profileData.experience.map((exp, index) => (
                      <div key={index} className="relative pl-8 border-l-2 border-blue-500">
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full"></div>
                        <div className="bg-gray-700 rounded-lg p-4">
                          <h4 className="font-semibold text-lg">{exp.title}</h4>
                          <div className="text-blue-400 font-medium">{exp.company}</div>
                          <div className="text-gray-400 text-sm mb-2">{exp.duration}</div>
                          <p className="text-gray-300">{exp.description}</p>
                          {exp.current && (
                            <span className="inline-block mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded">
                              Current Position
                            </span>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-gray-400 text-center py-8">
                        No experience added yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'education' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Education History</h3>
                  {isOwnProfile && (
                    <button
                      onClick={() => editMode.education ? saveSection('education') : toggleEditMode('education')}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                    >
                      {editMode.education ? 'Save' : 'Edit'}
                    </button>
                  )}
                </div>
                
                {editMode.education ? (
                  <div className="space-y-4">
                    {editData.education.map((edu, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-lg">Education {index + 1}</h4>
                          <button
                            onClick={() => removeEducation(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                            placeholder="Degree (e.g., Bachelor of Computer Science)"
                            className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                            placeholder="Institution Name"
                            className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={edu.year}
                            onChange={(e) => updateEducation(index, 'year', e.target.value)}
                            placeholder="Year (e.g., 2020-2024)"
                            className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={edu.grade}
                            onChange={(e) => updateEducation(index, 'grade', e.target.value)}
                            placeholder="Grade/GPA (e.g., 3.8/4.0)"
                            className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={addEducation}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                      >
                        Add Education
                      </button>
                      <button
                        onClick={() => saveSection('education')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => toggleEditMode('education')}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profileData.education.length > 0 ? profileData.education.map((edu, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4">
                        <h4 className="font-semibold text-lg">{edu.degree}</h4>
                        <div className="text-blue-400 font-medium">{edu.institution}</div>
                        <div className="text-gray-400 text-sm">{edu.year}</div>
                        {edu.grade && <div className="text-gray-300 mt-2">Grade: {edu.grade}</div>}
                      </div>
                    )) : (
                      <div className="text-gray-400 text-center py-8">
                        No education added yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
