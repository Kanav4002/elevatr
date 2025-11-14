require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Job = require('../models/job.model');

let genAI;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✅ Gemini AI ready');
  }
} catch (error) {
  console.error('❌ AI setup failed');
}

const generateInterviewQuestions = async (req, res) => {
  try {
    const { jobId } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID required' });
    }

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    console.log('🔍 Found job:', job.title);

    // Try AI first, but always have backup ready
    let questions = null;
    
    if (genAI) {
      try {
        console.log('🤖 Trying AI...');
        
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
        const prompt = `Create interview questions for ${job.title} at ${job.company}. 
        
Return ONLY this JSON (no other text):
{
  "technical": ["tech question 1", "tech question 2", "tech question 3", "tech question 4", "tech question 5"],
  "behavioral": ["behavior question 1", "behavior question 2", "behavior question 3", "behavior question 4", "behavior question 5"],
  "situational": ["situation question 1", "situation question 2", "situation question 3", "situation question 4", "situation question 5"]
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (text && text.trim()) {
          console.log('✅ AI responded');
          
          // Clean up the text
          let cleanText = text.trim();
          cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '');
          
          // Find the JSON part
          const start = cleanText.indexOf('{');
          const end = cleanText.lastIndexOf('}');
          
          if (start >= 0 && end > start) {
            const jsonText = cleanText.substring(start, end + 1);
            questions = JSON.parse(jsonText);
            console.log('✅ AI questions parsed successfully');
          }
        }
      } catch (aiError) {
        console.log('⚠️ AI failed:', aiError.message);
        console.log('⚠️ AI error details:', {
          name: aiError.name,
          status: aiError.status,
          statusText: aiError.statusText,
          stack: aiError.stack?.split('\n')[0] // Just first line of stack
        });
      }
    }

    // If AI didn't work, use backup questions
    if (!questions) {
      console.log('🔄 Using backup questions');
      questions = {
        technical: [
          `What technical skills are most important for a ${job.title} role?`,
          "How do you approach solving complex technical problems?",
          "What development tools and technologies do you prefer?",
          "How do you ensure your code is maintainable and scalable?",
          "Describe your experience with testing and debugging."
        ],
        behavioral: [
          `Why are you interested in the ${job.title} position at ${job.company}?`,
          "Tell me about a challenging project you've worked on.",
          "How do you handle feedback and criticism?",
          "Describe a time when you had to learn something new quickly.",
          "How do you prioritize tasks when you have multiple deadlines?"
        ],
        situational: [
          "How would you handle a disagreement with a team member?",
          "What would you do if you encountered a problem you couldn't solve?",
          "How would you approach a project with unclear requirements?",
          "How would you handle a situation where you made a mistake?",
          "What would you do if a project was running behind schedule?"
        ]
      };
    }

    // Send response
    res.json({
      success: true,
      questions,
      jobTitle: job.title,
      company: job.company,
      source: questions ? (genAI ? 'ai' : 'backup') : 'backup'
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Always send something back
    res.json({
      success: true,
      questions: {
        technical: [
          "What programming languages are you proficient in?",
          "How do you approach debugging issues?",
          "What development methodologies do you follow?",
          "How do you stay updated with technology trends?",
          "Describe your experience with code reviews."
        ],
        behavioral: [
          "Tell me about yourself and your background.",
          "What interests you about this role?",
          "How do you handle challenging situations?",
          "Describe your ideal work environment.",
          "What are your career goals?"
        ],
        situational: [
          "How would you handle a tight deadline?",
          "What would you do if you disagreed with a decision?",
          "How would you approach learning a new technology?",
          "How would you handle working with a difficult colleague?",
          "What would you do if you made an error in your work?"
        ]
      },
      jobTitle: 'Position',
      company: 'Company',
      source: 'fallback'
    });
  }
};

module.exports = {
  generateInterviewQuestions
};