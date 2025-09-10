
// server.js
import './env.js';

// Now import everything else
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { IntentBridge } from './core/IntentBridge.js';
import os from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const intentBridge = new IntentBridge();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Store execution history
const executionHistory = [];

// ---------- API Routes ----------

// Execute intent
app.post("/api/execute", async (req, res) => {
  const { intent } = req.body;

  if (!intent) {
    return res.status(400).json({ error: "Intent is required" });
  }

  console.log(`\n🌐 Web request: "${intent}"`);
  const result = await intentBridge.execute(intent);

  executionHistory.unshift({
    intent,
    result,
    timestamp: new Date().toISOString(),
  });

  if (executionHistory.length > 50) executionHistory.pop();

  res.json(result);
});

// List APIs
app.get("/api/apis", (req, res) => {
  res.json({ apis: intentBridge.listAPIs() });
});

// Register new API dynamically
app.post("/api/register", (req, res) => {
  const { id, name, baseUrl, key } = req.body;

  if (!id || !name || !baseUrl) {
    return res.status(400).json({ error: "id, name, and baseUrl are required" });
  }

  intentBridge.register(id, { name, baseUrl, key });
  res.json({ success: true, message: `API "${name}" registered.` });
});

// Stats
app.get("/api/stats", (req, res) => {
  res.json(intentBridge.getStats());
});

// History
app.get("/api/history", (req, res) => {
  res.json({ history: executionHistory });
});

// Demo
app.post("/api/demo", async (req, res) => {
  const demos = [
    "get weather in New York",
    "post 'Hello from IntentBridge!' to Twitter",
    "send 'Team update: IntentBridge is working!' to Slack channel general",
    "create GitHub repository called awesome-intent-bridge",
  ];

  const results = [];
  for (const demo of demos) {
    const result = await intentBridge.execute(demo);
    results.push({ intent: demo, result });
  }

  // Format demo results with success message and data for nicer UI
  const formattedDemos = results.map(({ intent, result }) => {
    if (result.success) {
      return {
        intent,
        message: result.message || 'Operation completed successfully',
        data: result.data || null,
        mock: result.mock || false,
      };
    } else {
      return {
        intent,
        error: result.error || 'Unknown error',
      };
    }
  });

  res.json({ demos: formattedDemos });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "IntentBridge",
    timestamp: new Date().toISOString(),
  });
});

// ---------- UI Route ----------
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>🚀 IntentBridge Dashboard</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
            color: #fff;
            margin: 0;
            padding: 0;
            line-height: 1.6;
          }
          header {
            padding: 20px;
            background: rgba(0,0,0,0.3);
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          }
          h1 { margin: 0; font-size: 2.5rem; }
          h2 { margin-top: 0; color: #4CAF50; }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .card {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
          }
          .full-width {
            grid-column: 1 / -1;
          }
          label { display: block; margin-top: 10px; font-weight: 500; }
          input, textarea {
            width: 100%;
            padding: 12px;
            margin-top: 4px;
            border-radius: 6px;
            border: none;
            background: rgba(255,255,255,0.9);
            color: #333;
            font-size: 14px;
          }
          textarea { resize: vertical; min-height: 60px; }
          button {
            margin-top: 15px;
            padding: 12px 20px;
            background: #1db954;
            border: none;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
          }
          button:hover { background: #17a74a; transform: translateY(-2px); }
          button:disabled { background: #666; cursor: not-allowed; }
          .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            background: rgba(0,0,0,0.3);
            border-left: 4px solid #4CAF50;
          }
          .error {
            border-left-color: #f44336;
            background: rgba(244, 67, 54, 0.1);
          }
          .demo-result {
            background: rgba(255,255,255,0.05);
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            border-left: 4px solid #2196F3;
          }
          .demo-result h4 { margin: 0 0 10px 0; color: #2196F3; }
          .loading { color: #ffeb3b; }
          ul { padding-left: 20px; }
          .stats { display: flex; justify-content: space-around; margin-top: 20px; }
          .stat { text-align: center; }
          .stat-number { font-size: 2rem; font-weight: bold; color: #4CAF50; }
          pre {
            background: rgba(0,0,0,0.5);
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 12px;
            color: #e0e0e0;
          }
          .api-integration-result {
            background: rgba(76, 175, 80, 0.1);
            border-left-color: #4CAF50;
            padding: 20px;
            margin-top: 20px;
            border-radius: 8px;
          }
          .api-integration-result h3 { color: #4CAF50; margin-top: 0; }
        </style>
      </head>
      <body>
        <header>
          <h1>🚀 IntentBridge Dashboard</h1>
          <p>AI-Powered API Integration & Execution</p>
        </header>

        <div class="container">
          <!-- Execute Intent Section -->
          <div class="card full-width">
            <h2>🎯 Execute Intent</h2>
            <p>Enter any natural language command to interact with APIs</p>
            <label>Intent <textarea id="intentInput" placeholder="e.g., 'integrate Stripe API with key sk_test_...', 'get weather in New York', 'send SMS to +1234567890'"></textarea></label>
            <button onclick="executeIntent()" id="executeBtn">Execute Intent</button>
            <button onclick="runDemo()" id="demoBtn">Run Demo</button>
            <div id="resultContainer"></div>
          </div>

          <div class="grid">
            <!-- Register API -->
            <div class="card">
              <h2>➕ Register New API</h2>
              <label>API ID <input id="apiId" placeholder="e.g. weather"></label>
              <label>Name <input id="apiName" placeholder="e.g. OpenWeatherMap"></label>
              <label>Base URL <input id="apiBase" placeholder="https://api.example.com"></label>
              <label>API Key (optional) <input id="apiKey" placeholder="your-api-key"></label>
              <button onclick="registerAPI()">Register API</button>
              <p id="registerMsg"></p>
            </div>

            <!-- List APIs -->
            <div class="card">
              <h2>📋 Registered APIs</h2>
              <ul id="apiList"></ul>
            </div>
          </div>

          <!-- Stats Section -->
          <div class="card full-width">
            <h2>📊 System Stats</h2>
            <div id="statsContainer">Loading stats...</div>
          </div>
        </div>

        <script>
          async function executeIntent() {
            const intent = document.getElementById('intentInput').value.trim();
            if (!intent) {
              showResult('Please enter an intent', 'error');
              return;
            }

            const btn = document.getElementById('executeBtn');
            btn.disabled = true;
            btn.textContent = 'Executing...';

            try {
              const res = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ intent })
              });
              const result = await res.json();
              displayResult(result);
            } catch (error) {
              showResult('Error: ' + error.message, 'error');
            } finally {
              btn.disabled = false;
              btn.textContent = 'Execute Intent';
            }
          }

          async function runDemo() {
            const btn = document.getElementById('demoBtn');
            btn.disabled = true;
            btn.textContent = 'Running Demo...';

            try {
              const res = await fetch('/api/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });
              const data = await res.json();
              displayDemoResults(data.demos);
            } catch (error) {
              showResult('Demo error: ' + error.message, 'error');
            } finally {
              btn.disabled = false;
              btn.textContent = 'Run Demo';
            }
          }

          function displayResult(result) {
            const container = document.getElementById('resultContainer');
            container.innerHTML = '';

            if (result.success) {
              if (result.endpoints) {
                // API Integration Result
                container.innerHTML = \`
                  <div class="api-integration-result">
                    <h3>✅ API Integration Successful!</h3>
                    <p>\${result.message}</p>
                    <p><strong>Available Endpoints:</strong></p>
                    <ul>
                      \${result.endpoints.map(endpoint => \`<li>\${endpoint}</li>\`).join('')}
                    </ul>
                    <p><em>\${result.example}</em></p>
                  </div>
                \`;
              } else {
                // Regular API Result
                container.innerHTML = \`
                  <div class="result">
                    <h3>\${result.message || 'Operation completed successfully'}</h3>
                    \${result.data ? \`<pre>\${JSON.stringify(result.data, null, 2)}</pre>\` : ''}
                    \${result.executionTime ? \`<p><strong>Execution Time:</strong> \${result.executionTime}</p>\` : ''}
                    \${result.mock ? '<p><em>⚠️ This is mock data (API not available)</em></p>' : ''}
                  </div>
                \`;
              }
            } else {
              container.innerHTML = \`
                <div class="result error">
                  <h3>❌ Error</h3>
                  <p>\${result.error || result.message}</p>
                  \${result.suggestion ? \`<p><strong>Suggestion:</strong> \${result.suggestion}</p>\` : ''}
                  \${result.available_apis ? \`<p><strong>Available APIs:</strong> \${result.available_apis.join(', ')}</p>\` : ''}
                </div>
              \`;
            }
          }

          function displayDemoResults(demos) {
            const container = document.getElementById('resultContainer');
            container.innerHTML = '<h3>🎬 Demo Results</h3>';

            demos.forEach(demo => {
              const demoDiv = document.createElement('div');
              demoDiv.className = 'demo-result';

              if (demo.message) {
                demoDiv.innerHTML = \`
                  <h4>🎯 "\${demo.intent}"</h4>
                  <p>\${demo.message}</p>
                  \${demo.data ? \`<pre>\${JSON.stringify(demo.data, null, 2)}</pre>\` : ''}
                  \${demo.mock ? '<p><em>⚠️ Mock data (API not available)</em></p>' : ''}
                \`;
              } else {
                demoDiv.innerHTML = \`
                  <h4>❌ "\${demo.intent}"</h4>
                  <p>\${demo.error}</p>
                \`;
                demoDiv.className += ' error';
              }

              container.appendChild(demoDiv);
            });
          }

          function showResult(message, type = 'success') {
            const container = document.getElementById('resultContainer');
            container.innerHTML = \`<div class="result \${type === 'error' ? 'error' : ''}"><p>\${message}</p></div>\`;
          }

          async function fetchAPIs() {
            try {
              const res = await fetch('/api/apis');
              const data = await res.json();
              const list = document.getElementById('apiList');
              list.innerHTML = '';

              if (Object.keys(data.apis).length === 0) {
                list.innerHTML = '<li>No APIs registered yet</li>';
                return;
              }

              for (const [id, api] of Object.entries(data.apis)) {
                const li = document.createElement('li');
                li.textContent = \`\${id} → \${api.name} (\${api.baseUrl})\`;
                list.appendChild(li);
              }
            } catch (error) {
              console.error('Failed to fetch APIs:', error);
            }
          }

          async function registerAPI() {
            const id = document.getElementById('apiId').value;
            const name = document.getElementById('apiName').value;
            const baseUrl = document.getElementById('apiBase').value;
            const key = document.getElementById('apiKey').value;

            const res = await fetch('/api/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, name, baseUrl, key })
            });
            const data = await res.json();
            document.getElementById('registerMsg').textContent = data.message || data.error;
            fetchAPIs();
          }

          async function loadStats() {
            try {
              const res = await fetch('/api/stats');
              const stats = await res.json();
              const container = document.getElementById('statsContainer');

              container.innerHTML = \`
                <div class="stats">
                  <div class="stat">
                    <div class="stat-number">\${stats.totalExecutions || 0}</div>
                    <div>Total Executions</div>
                  </div>
                  <div class="stat">
                    <div class="stat-number">\${stats.totalLearned || 0}</div>
                    <div>Learned Patterns</div>
                  </div>
                  <div class="stat">
                    <div class="stat-number">\${stats.totalAPIs || 0}</div>
                    <div>Registered APIs</div>
                  </div>
                </div>
              \`;
            } catch (error) {
              console.error('Failed to load stats:', error);
              document.getElementById('statsContainer').innerHTML = 'Failed to load stats';
            }
          }

          // Load initial data
          fetchAPIs();
          loadStats();
        </script>
      </body>
    </html>
  `);
});

// ---------- Utils ----------
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// ---------- Start Server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 IntentBridge Dashboard running!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📍 Network: http://${getLocalIP()}:${PORT}`);
});
