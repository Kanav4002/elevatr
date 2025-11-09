const User = require('../models/user.model');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'profilePicture') {
      // Allow only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for profile picture'), false);
      }
    } else if (file.fieldname === 'resume') {
      // Allow only PDF files for resumes
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed for resumes'), false);
      }
    } else {
      cb(new Error('Invalid field name'), false);
    }
  }
});

// Get user profile (public or private based on ownership)
const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.id;
    
    // If route is /me, get current user's profile, otherwise get specified user's profile
    const targetUserId = req.route.path === '/me' ? requestingUserId : userId;
    
    if (!targetUserId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(targetUserId)
      .populate('profile.followers', 'name email profile.profilePicture')
      .populate('profile.following', 'name email profile.profilePicture')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize profile structure if it doesn't exist
    if (!user.profile) {
      user.profile = {
        headline: '',
        location: '',
        bio: '',
        profilePicture: '',
        skills: [],
        experience: [],
        education: [],
        socialLinks: {},
        resumes: [],
        isPublic: true,
        followers: [],
        following: [],
        atsAnalytics: []
      };
      await user.save();
    }

    // Check if profile is public or if it's the user's own profile
    const isOwnProfile = requestingUserId && requestingUserId === targetUserId;
    const isPublic = user.profile?.isPublic !== false;

    if (!isOwnProfile && !isPublic) {
      return res.status(403).json({ message: 'This profile is private' });
    }

    // Prepare response data
    const profileData = {
      id: user._id,
      name: user.name,
      email: isOwnProfile ? user.email : undefined,
      role: user.role,
      profile: {
        headline: user.profile?.headline || '',
        location: user.profile?.location || '',
        bio: user.profile?.bio || '',
        profilePicture: user.profile?.profilePicture || '',
        skills: user.profile?.skills || [],
        experience: user.profile?.experience || [],
        education: user.profile?.education || [],
        socialLinks: user.profile?.socialLinks || {},
        isPublic: user.profile?.isPublic !== false,
        followers: user.profile?.followers || [],
        following: user.profile?.following || [],
        followersCount: user.profile?.followers?.length || 0,
        followingCount: user.profile?.following?.length || 0,
        isFollowing: requestingUserId ? user.profile?.followers?.some(f => f.toString() === requestingUserId) : false
      },
      // Only include private data for own profile
      ...(isOwnProfile && {
        privateData: {
          resumes: user.profile?.resumes || [],
          atsAnalytics: user.profile?.atsAnalytics || []
        }
      })
    };

    res.json({
      success: true,
      profile: profileData,
      isOwnProfile
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Validate and sanitize update data
    const allowedFields = [
      'headline', 'location', 'bio', 'skills', 'experience', 
      'education', 'socialLinks', 'isPublic'
    ];

    const profileUpdate = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        profileUpdate[`profile.${key}`] = updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: profileUpdate },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: user.profile
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const profilePictureUrl = `/uploads/${req.file.filename}`;

    // Get the user first and initialize profile if needed
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize profile structure if it doesn't exist
    if (!user.profile) {
      user.profile = {};
    }

    // Set the profile picture
    user.profile.profilePicture = profilePictureUrl;

    // Save the user
    user = await user.save();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePictureUrl
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload resume
const uploadResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, isDefault } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const resumeData = {
      name: name || req.file.originalname,
      filename: req.file.filename,
      fileUrl: `/uploads/${req.file.filename}`,
      uploadDate: new Date(),
      isDefault: isDefault === 'true'
    };

    // Get the user first and initialize profile if needed
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize profile structure if it doesn't exist
    if (!user.profile) {
      user.profile = {};
    }
    if (!user.profile.resumes) {
      user.profile.resumes = [];
    }

    // If this is set as default, unset other defaults
    if (resumeData.isDefault) {
      user.profile.resumes.forEach(resume => {
        resume.isDefault = false;
      });
    }

    // Add the new resume
    user.profile.resumes.push(resumeData);

    // Save the user
    user = await user.save();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      resume: resumeData
    });

  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Set default resume
const setDefaultResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { resumeId } = req.params;

    // First, unset all defaults
    await User.updateOne(
      { _id: userId },
      { $set: { 'profile.resumes.$[].isDefault': false } }
    );

    // Then set the specified resume as default
    const user = await User.findOneAndUpdate(
      { 
        _id: userId,
        'profile.resumes._id': resumeId
      },
      { $set: { 'profile.resumes.$.isDefault': true } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User or resume not found' });
    }

    res.json({
      success: true,
      message: 'Default resume updated successfully'
    });

  } catch (error) {
    console.error('Error setting default resume:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete resume
const deleteResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { resumeId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { 'profile.resumes': { _id: resumeId } } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Follow/Unfollow user
const toggleFollow = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    if (userId === targetUserId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = user.profile?.following?.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(userId, {
        $pull: { 'profile.following': targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { 'profile.followers': userId }
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(userId, {
        $addToSet: { 'profile.following': targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { 'profile.followers': userId }
      });
    }

    res.json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing
    });

  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ATS Analysis (Mock implementation - integrate with AI service)
const analyzeResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobDescription, resumeId } = req.body;

    if (!jobDescription || !resumeId) {
      return res.status(400).json({ 
        message: 'Job description and resume ID are required' 
      });
    }

    // Mock ATS analysis - replace with actual AI service
    const mockAnalysis = {
      score: Math.floor(Math.random() * 40) + 60, // 60-100%
      suggestions: [
        'Add more relevant keywords from the job description',
        'Include specific technologies mentioned in the job posting',
        'Quantify your achievements with numbers and metrics',
        'Tailor your experience section to match job requirements'
      ],
      missingKeywords: ['React', 'Node.js', 'AWS', 'Agile'],
      matchedKeywords: ['JavaScript', 'MongoDB', 'REST API']
    };

    // Save analysis to user profile
    const analysisData = {
      jobDescription,
      resumeId,
      score: mockAnalysis.score,
      suggestions: mockAnalysis.suggestions,
      analyzedAt: new Date()
    };

    await User.findByIdAndUpdate(
      userId,
      { $push: { 'profile.atsAnalytics': analysisData } }
    );

    res.json({
      success: true,
      analysis: mockAnalysis
    });

  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  uploadResume,
  setDefaultResume,
  deleteResume,
  toggleFollow,
  analyzeResume,
  upload
};
