const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  try {
    console.log('🔑 Testing API Key:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try different model names for free tier
    const modelNames = [
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest', 
      'gemini-1.0-pro',
      'gemini-pro'
    ];
    
    let workingModel = null;
    
    for (const modelName of modelNames) {
      try {
        console.log(`🧪 Testing model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent("Say hello in JSON format: {\"message\": \"your response\"}");
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ Model ${modelName} is working!`);
        console.log('📝 Response:', text);
        workingModel = modelName;
        break;
        
      } catch (modelError) {
        console.log(`❌ Model ${modelName} failed:`, modelError.message);
        continue;
      }
    }
    
    if (workingModel) {
      console.log(`🎉 Success! Use model: ${workingModel}`);
      
      // Test JSON parsing
      try {
        const model = genAI.getGenerativeModel({ model: workingModel });
        const result = await model.generateContent("Return only this JSON: {\"message\": \"Hello World\", \"status\": \"success\"}");
        const response = await result.response;
        const text = response.text();
        
        const cleanText = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const parsed = JSON.parse(cleanText);
        console.log('✅ JSON parsing successful:', parsed);
      } catch (e) {
        console.log('⚠️ JSON parsing test failed:', e.message);
      }
      
    } else {
      console.log('❌ No working models found');
    }
    
  } catch (error) {
    console.error('❌ API Key test failed:', error.message);
    
    if (error.message.includes('API key not valid')) {
      console.log('🔧 Try generating a new API key at: https://aistudio.google.com/app/apikey');
    }
  }
}

testGemini();