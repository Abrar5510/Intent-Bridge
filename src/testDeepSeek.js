// src/testDeepSeek.js 

import dotenv from 'dotenv'; 

import { IntentParser } from './core/IntentParser.js'; 

 

dotenv.config(); 

 

async function testDeepSeek() { 

  console.log('🧪 Testing DeepSeek Integration\n'); 

   

  const parser = new IntentParser(); 

   

  const testIntents = [ 

    'get weather in Tokyo', 

    'charge $50 using Stripe', 

    'integrate Razorpay API with key rzp_test_123', 

    'send SMS saying Hello', 

    'get latest news about AI' 

  ]; 

   

  for (const intent of testIntents) { 

    console.log(`\n📝 Intent: "${intent}"`); 

    try { 

      const result = await parser.parse(intent); 

      console.log('✅ Parsed:', JSON.stringify(result, null, 2)); 

    } catch (error) { 

      console.log('❌ Error:', error.message); 

    } 

  } 

} 

 

testDeepSeek(); 