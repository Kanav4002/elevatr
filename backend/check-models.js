require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

async function checkAvailableModels() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ No GEMINI_API_KEY found in environment');
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('🔍 Checking available Gemini models...\n');

    // List of models to test (ordered by preference)
    const modelsToTest = [
      'gemini-2.0-flash-exp',      // Latest experimental
      'gemini-1.5-pro',           // Most capable
      'gemini-1.5-flash',         // Fast and efficient
      'gemini-1.5-flash-latest',  // Latest flash
      'gemini-flash-latest',      // Generic latest
      'gemini-pro',               // Legacy pro
      'gemini-1.0-pro',          // Legacy 1.0
      'gemini-1.0-pro-latest'    // Legacy latest
    ];

    const availableModels = [];
    const unavailableModels = [];

    for (const modelName of modelsToTest) {
      try {
        console.log(`Testing ${modelName}...`);
        
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Try a simple test generation
        const result = await model.generateContent('Hello, respond with just "OK"');
        const response = await result.response;
        const text = response.text();
        
        if (text && text.trim()) {
          console.log(`✅ ${modelName} - AVAILABLE (Response: ${text.trim()})`);
          availableModels.push(modelName);
        } else {
          console.log(`⚠️ ${modelName} - No response`);
          unavailableModels.push(modelName);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`❌ ${modelName} - ERROR: ${error.message}`);
        unavailableModels.push(modelName);
        
        // If we hit rate limits, wait longer
        if (error.status === 429) {
          console.log('⏳ Rate limit hit, waiting 30 seconds...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        } else {
          // Short delay for other errors
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.log('\n📊 RESULTS SUMMARY:');
    console.log('==================');
    
    if (availableModels.length > 0) {
      console.log('\n✅ AVAILABLE MODELS:');
      availableModels.forEach(model => console.log(`  - ${model}`));
      
      console.log('\n🔧 RECOMMENDED MODEL ORDER FOR CODE:');
      const modelArrayCode = `const modelNames = [${availableModels.map(m => `'${m}'`).join(', ')}];`;
      console.log(modelArrayCode);
      
      // Auto-update controller files
      await updateControllerFiles(availableModels);
      
    } else {
      console.log('\n❌ NO MODELS AVAILABLE');
      console.log('⚠️ Falling back to keyword-based analysis only');
    }
    
    if (unavailableModels.length > 0) {
      console.log('\n❌ UNAVAILABLE MODELS:');
      unavailableModels.forEach(model => console.log(`  - ${model}`));
    }

  } catch (error) {
    console.error('❌ Error checking models:', error.message);
  }
}

async function updateControllerFiles(availableModels) {
  try {
    console.log('\n🔄 Auto-updating controller files...');
    
    const modelArrayString = availableModels.map(m => `'${m}'`).join(', ');
    
    // Update AI controller
    const aiControllerPath = path.join(__dirname, 'controllers', 'ai.controller.js');
    if (fs.existsSync(aiControllerPath)) {
      let aiContent = fs.readFileSync(aiControllerPath, 'utf8');
      
      // Replace the modelNames array
      const aiUpdated = aiContent.replace(
        /const modelNames = \[.*?\];/s,
        `const modelNames = [${modelArrayString}];`
      );
      
      if (aiUpdated !== aiContent) {
        fs.writeFileSync(aiControllerPath, aiUpdated);
        console.log('✅ Updated ai.controller.js');
      } else {
        console.log('ℹ️ ai.controller.js already up to date');
      }
    }
    
    // Update Profile controller
    const profileControllerPath = path.join(__dirname, 'controllers', 'profile.controller.js');
    if (fs.existsSync(profileControllerPath)) {
      let profileContent = fs.readFileSync(profileControllerPath, 'utf8');
      
      // Replace the modelNames array
      const profileUpdated = profileContent.replace(
        /const modelNames = \[.*?\];/s,
        `const modelNames = [${modelArrayString}];`
      );
      
      if (profileUpdated !== profileContent) {
        fs.writeFileSync(profileControllerPath, profileUpdated);
        console.log('✅ Updated profile.controller.js');
      } else {
        console.log('ℹ️ profile.controller.js already up to date');
      }
    }
    
    // Save results to a JSON file for future reference
    const resultsPath = path.join(__dirname, 'available-models.json');
    const results = {
      lastChecked: new Date().toISOString(),
      availableModels,
      totalTested: 8, // Total models tested
      status: availableModels.length > 0 ? 'success' : 'no_models_available'
    };
    
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log('📄 Saved results to available-models.json');
    
  } catch (error) {
    console.error('❌ Error updating controller files:', error.message);
  }
}

// Run the check
checkAvailableModels().then(() => {
  console.log('\n🏁 Model check complete!');
  console.log('💡 Run "npm run check-models" to check again anytime');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});