// testKey.js 

import dotenv from 'dotenv'; 

dotenv.config(); 

 

console.log('Checking API Keys...\n'); 

 

// Check DeepSeek 

if (process.env.DEEPSEEK_API_KEY) { 

  console.log('✅ DeepSeek API Key found:',  

    process.env.DEEPSEEK_API_KEY.substring(0, 10) + '...'); 

} else { 

  console.log('❌ DeepSeek API Key NOT FOUND'); 

} 

 

// Check other keys 

if (process.env.OPENWEATHER_API_KEY) { 

  console.log('✅ OpenWeather API Key found'); 

} else { 

  console.log('⚠️ OpenWeather API Key not found (optional)'); 

} 

 

console.log('\n.env file location:', process.cwd() + '\\.env'); 