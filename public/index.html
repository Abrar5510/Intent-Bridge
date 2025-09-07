// src/dashboard.js 

import express from 'express'; 

import cors from 'cors'; 

import bodyParser from 'body-parser'; 

import path from 'path'; 

import { fileURLToPath } from 'url'; 

import { IntentBridge } from './core/IntentBridge.js'; 

 

const __dirname = path.dirname(fileURLToPath(import.meta.url)); 

const app = express(); 

const intentBridge = new IntentBridge(); 

 

// Middleware 

app.use(cors()); 

app.use(bodyParser.json()); 

app.use(express.static(path.join(__dirname, '../public'))); 

 

// Store execution history 

const executionHistory = []; 

 

// API Routes 

app.post('/api/execute', async (req, res) => { 

  const { intent } = req.body; 

   

  if (!intent) { 

    return res.status(400).json({ error: 'Intent is required' }); 

  } 

   

  console.log(`\n🌐 Web request: "${intent}"`); 

   

  const result = await intentBridge.execute(intent); 

   

  // Store in history 

  executionHistory.unshift({ 

    intent, 

    result, 

    timestamp: new Date().toISOString() 

  }); 

   

  // Keep only last 50 executions 

  if (executionHistory.length > 50) { 

    executionHistory.pop(); 

  } 

   

  res.json(result); 

}); 

 

app.get('/api/apis', (req, res) => { 

  const apis = intentBridge.listAPIs(); 

  res.json({ apis }); 

}); 

 

app.get('/api/stats', (req, res) => { 

  const stats = intentBridge.getStats(); 

  res.json(stats); 

}); 

 

app.get('/api/history', (req, res) => { 

  res.json({ history: executionHistory }); 

}); 

 

app.post('/api/demo', async (req, res) => { 

  // Run demo scenarios 

  const demos = [ 

    "get weather in New York", 

    "post 'Hello from IntentBridge!' to Twitter", 

    "send 'Team update: IntentBridge is working!' to Slack channel general", 

    "create GitHub repository called awesome-intent-bridge" 

  ]; 

   

  const results = []; 

  for (const demo of demos) { 

    const result = await intentBridge.execute(demo); 

    results.push({ intent: demo, result }); 

  } 

   

  res.json({ demos: results }); 

}); 

 

// Health check 

app.get('/health', (req, res) => { 

  res.json({  

    status: 'ok',  

    service: 'IntentBridge', 

    timestamp: new Date().toISOString() 

  }); 

}); 

 

const PORT = process.env.PORT || 3000; 

app.listen(PORT, () => { 

  console.log(`\n🚀 IntentBridge Dashboard running!`); 

  console.log(`📍 Local: http://localhost:${PORT}`); 

  console.log(`📍 Network: http://${getLocalIP()}:${PORT}`); 

  console.log(`\n💡 Try these examples:`); 

  console.log(`   - "get weather in Tokyo"`); 

  console.log(`   - "post 'Hello World' to Twitter"`); 

  console.log(`   - "send 'Hi team' to Slack"`); 

  console.log(`   - "create GitHub repo called my-project"`); 

}); 

 

function getLocalIP() { 

  const os = require('os'); 

  const interfaces = os.networkInterfaces(); 

  for (const name of Object.keys(interfaces)) { 

    for (const iface of interfaces[name]) { 

      if (iface.family === 'IPv4' && !iface.internal) { 

        return iface.address; 

      } 

    } 

  } 

  return 'localhost'; 

} 