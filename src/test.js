// src/test.js 

import { IntentBridge } from './core/IntentBridge.js'; 

import dotenv from 'dotenv'; 

 

dotenv.config(); 

 

console.log('🧪 IntentBridge Test Suite\n'); 

console.log('=' .repeat(50)); 

 

const bridge = new IntentBridge(); 

 

const testCases = [ 

    { 

        name: 'Weather Query', 

        intent: 'get weather in Paris', 

        expected: 'weather' 

    }, 

    { 

        name: 'Twitter Post', 

        intent: 'post "Testing IntentBridge!" to Twitter', 

        expected: 'twitter' 

    }, 

    { 

        name: 'Slack Message', 

        intent: 'send "Hello team" to Slack channel general', 

        expected: 'slack' 

    }, 

    { 

        name: 'GitHub Repo', 

        intent: 'create GitHub repository called test-repo', 

        expected: 'github' 

    } 

]; 

 

async function runTests() { 

    let passed = 0; 

    let failed = 0; 

     

    for (const test of testCases) { 

        console.log(`\n📝 Test: ${test.name}`); 

        console.log(`   Intent: "${test.intent}"`); 

         

        try { 

            const result = await bridge.execute(test.intent); 

             

            if (result.success) { 

                console.log(`   ✅ PASSED`); 

                if (result.message) { 

                    console.log(`   Result: ${result.message}`); 

                } 

                passed++; 

            } else { 

                console.log(`   ❌ FAILED: ${result.error}`); 

                failed++; 

            } 

        } catch (error) { 

            console.log(`   ❌ ERROR: ${error.message}`); 

            failed++; 

        } 

    } 

     

    console.log('\n' + '='.repeat(50)); 

    console.log(`📊 Results: ${passed} passed, ${failed} failed`); 

    console.log('=' .repeat(50)); 

} 

 

runTests(); 