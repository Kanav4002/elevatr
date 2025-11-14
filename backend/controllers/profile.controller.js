const User = require('../models/user.model');
const multer = require('multer');
const path = require('path');
const { createFollowNotification } = require('./notification.controller');

// Import AI functionality
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✅ Gemini AI ready for ATS analysis');
  }
} catch (error) {
  console.error('❌ AI setup failed for ATS analysis');
}

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

    // Get updated follower counts
    const updatedTargetUser = await User.findById(targetUserId).select('profile.followers profile.following');
    const followersCount = updatedTargetUser.profile?.followers?.length || 0;
    const followingCount = updatedTargetUser.profile?.following?.length || 0;

    // Send follow notification (only when following, not unfollowing)
    if (!isFollowing) {
      try {
        console.log(`🔔 Attempting to send follow notification from ${user.name} (${userId}) to ${targetUserId}`);
        await createFollowNotification({
          followerId: userId,
          followedId: targetUserId,
          followerName: user.name
        });
        console.log(`📢 Follow notification sent from ${user.name}`);
      } catch (notificationError) {
        console.error('Error sending follow notification:', notificationError);
        console.error('Full error details:', notificationError);
        // Don't fail the follow action if notification fails
      }
    } else {
      console.log(`ℹ️ User was unfollowing, no notification sent`);
    }

    res.json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing,
      followersCount,
      followingCount
    });

  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// AI-Powered ATS Analysis using Gemini
const analyzeResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobDescription, resumeId } = req.body;

    if (!jobDescription || !resumeId) {
      return res.status(400).json({ 
        message: 'Job description and resume ID are required' 
      });
    }

    console.log('🔍 Starting ATS analysis...');

    // Get user profile to analyze against job description
    const user = await User.findById(userId).select('profile');
    if (!user || !user.profile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Build user profile summary for AI analysis
    const profileSummary = {
      bio: user.profile.bio || 'No bio provided',
      skills: user.profile.skills?.map(skill => `${skill.name} (${skill.level})`).join(', ') || 'No skills listed',
      experience: user.profile.experience?.map(exp => 
        `${exp.title} at ${exp.company} - ${exp.duration}: ${exp.description}`
      ).join('\n') || 'No experience listed',
      education: user.profile.education?.map(edu => 
        `${edu.degree} from ${edu.institution} (${edu.year}) - Grade: ${edu.grade || 'N/A'}`
      ).join('\n') || 'No education listed'
    };

    let analysis = null;

    // Try AI analysis first
    if (genAI) {
      try {
        console.log('🤖 Using AI for ATS analysis...');
        
        // Use only available models (checked via script)
        const modelNames = ['gemini-flash-latest'];
        let model = null;
        
        for (const modelName of modelNames) {
          try {
            model = genAI.getGenerativeModel({ model: modelName });
            console.log(`✅ Using model: ${modelName}`);
            break;
          } catch (modelError) {
            console.log(`⚠️ Model ${modelName} not available:`, modelError.message);
            continue;
          }
        }
        
        if (!model) {
          throw new Error('No available Gemini models found');
        }

        const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze how well this candidate's profile matches the job description.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
Bio: ${profileSummary.bio}

Skills: ${profileSummary.skills}

Experience:
${profileSummary.experience}

Education:
${profileSummary.education}

Provide a detailed ATS analysis. Return ONLY this JSON format (no other text):
{
  "score": 75,
  "matchedKeywords": ["keyword1", "keyword2", "keyword3"],
  "missingKeywords": ["missing1", "missing2", "missing3"],
  "suggestions": [
    "Add specific suggestion 1",
    "Add specific suggestion 2", 
    "Add specific suggestion 3",
    "Add specific suggestion 4"
  ],
  "strengths": [
    "Strength 1 based on profile",
    "Strength 2 based on profile"
  ],
  "weaknesses": [
    "Weakness 1 to improve",
    "Weakness 2 to improve"
  ],
  "overallFeedback": "Detailed paragraph about the candidate's fit for this role"
}

Score should be 0-100 based on actual match quality. Be realistic and helpful.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (text && text.trim()) {
          console.log('✅ AI ATS analysis received');
          
          // Clean up the text
          let cleanText = text.trim();
          cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');
          
          // Find the JSON part
          const start = cleanText.indexOf('{');
          const end = cleanText.lastIndexOf('}');
          
          if (start >= 0 && end > start) {
            const jsonText = cleanText.substring(start, end + 1);
            analysis = JSON.parse(jsonText);
            console.log('✅ AI ATS analysis parsed successfully');
          }
        }
      } catch (aiError) {
        console.log('⚠️ AI ATS analysis failed:', aiError.message);
        console.log('⚠️ AI error details:', {
          name: aiError.name,
          status: aiError.status,
          statusText: aiError.statusText,
          stack: aiError.stack?.split('\n')[0]
        });
      }
    }

    // Fallback analysis if AI fails
    if (!analysis) {
      console.log('🔄 Using fallback ATS analysis');
      analysis = generateFallbackAnalysis(jobDescription, user.profile);
    }

    // Ensure analysis has required fields
    analysis = {
      score: analysis.score || 50,
      suggestions: analysis.suggestions || ['Add more relevant skills to your profile', 'Include specific achievements with metrics'],
      missingKeywords: analysis.missingKeywords || [],
      matchedKeywords: analysis.matchedKeywords || [],
      strengths: analysis.strengths || ['Professional profile setup'],
      weaknesses: analysis.weaknesses || ['Profile needs more detail'],
      overallFeedback: analysis.overallFeedback || 'Your profile shows potential but could benefit from more specific details and relevant keywords.',
      totalKeywords: (analysis.matchedKeywords?.length || 0) + (analysis.missingKeywords?.length || 0),
      matchedCount: analysis.matchedKeywords?.length || 0
    };

    // Save analysis to user profile
    const analysisData = {
      jobDescription: jobDescription.substring(0, 500), // Limit storage
      resumeId,
      score: analysis.score,
      suggestions: analysis.suggestions,
      analyzedAt: new Date()
    };

    // Initialize atsAnalytics if it doesn't exist
    if (!user.profile.atsAnalytics) {
      user.profile.atsAnalytics = [];
    }
    user.profile.atsAnalytics.push(analysisData);
    
    // Keep only last 10 analyses
    if (user.profile.atsAnalytics.length > 10) {
      user.profile.atsAnalytics = user.profile.atsAnalytics.slice(-10);
    }
    
    await user.save();

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fallback analysis function when AI is not available
const generateFallbackAnalysis = (jobDescription, profile) => {
  const jobText = jobDescription.toLowerCase();
  
  // Extract basic keywords
  const techKeywords = ['javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 'mongodb', 'sql', 'aws', 'docker', 'git'];
  const softSkills = ['leadership', 'communication', 'teamwork', 'problem solving', 'analytical'];
  
  const allKeywords = [...techKeywords, ...softSkills];
  const userSkills = profile.skills?.map(skill => skill.name.toLowerCase()) || [];
  const userExperience = profile.experience?.map(exp => `${exp.title} ${exp.description}`.toLowerCase()).join(' ') || '';
  
  const matchedKeywords = [];
  const missingKeywords = [];
  
  allKeywords.forEach(keyword => {
    if (jobText.includes(keyword)) {
      const isMatched = userSkills.some(skill => skill.includes(keyword)) || userExperience.includes(keyword);
      if (isMatched) {
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    }
  });
  
  // Calculate score
  const totalKeywords = matchedKeywords.length + missingKeywords.length;
  let score = totalKeywords > 0 ? Math.round((matchedKeywords.length / totalKeywords) * 100) : 50;
  
  // Add bonus points
  if (profile.bio && profile.bio.length > 50) score += 5;
  if (profile.skills && profile.skills.length > 3) score += 5;
  if (profile.experience && profile.experience.length > 0) score += 10;
  
  score = Math.min(100, Math.max(30, score));
  
  return {
    score,
    matchedKeywords: matchedKeywords.slice(0, 6),
    missingKeywords: missingKeywords.slice(0, 6),
    suggestions: [
      'Add more relevant skills to your profile',
      'Include specific achievements with metrics',
      'Tailor your experience descriptions to match job requirements',
      'Add missing technical skills mentioned in the job description'
    ],
    strengths: ['Professional profile setup', 'Relevant experience background'],
    weaknesses: ['Could add more specific technical details', 'Profile needs more keyword optimization'],
    overallFeedback: `Your profile shows a ${score >= 70 ? 'good' : score >= 50 ? 'moderate' : 'basic'} match for this position. Focus on adding the missing keywords and expanding your technical skill descriptions.`
  };
};

// Download resume
const downloadResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user.id;

    // Find the user and the specific resume
    const user = await User.findById(userId).select('profile.resumes');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resume = user.profile?.resumes?.find(r => r._id.toString() === resumeId);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', resume.filename);
    
    // Check if file exists
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ message: 'Resume file not found on server' });
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${resume.name}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    // Send the file
    res.sendFile(filePath);

  } catch (error) {
    console.error('Error downloading resume:', error);
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
  downloadResume,
  toggleFollow,
  analyzeResume,
  upload
};
