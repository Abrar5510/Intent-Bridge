
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

import { IntentBridge } from "./core/IntentBridge.js";

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

  res.json({ demos: results });
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
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
            color: #fff;
            margin: 0;
            padding: 0;
          }
          header {
            padding: 20px;
            background: rgba(0,0,0,0.3);
            text-align: center;
          }
          h1 { margin: 0; font-size: 2rem; }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 20px;
          }
          .card {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 12px;
          }
          label { display: block; margin-top: 10px; }
          input {
            width: 100%;
            padding: 8px;
            margin-top: 4px;
            border-radius: 6px;
            border: none;
          }
          button {
            margin-top: 15px;
            padding: 10px 15px;
            background: #1db954;
            border: none;
            color: white;
            border-radius: 6px;
            cursor: pointer;
          }
          button:hover { background: #17a74a; }
          ul { padding-left: 20px; }
        </style>
      </head>
      <body>
        <header>
          <h1>🚀 IntentBridge Dashboard</h1>
          <p>Manage APIs & Run Intents</p>
        </header>
        <div class="grid">
          <!-- Left: Register API -->
          <div class="card">
            <h2>➕ Register New API</h2>
            <label>API ID <input id="apiId" placeholder="e.g. weather"></label>
            <label>Name <input id="apiName" placeholder="e.g. OpenWeatherMap"></label>
            <label>Base URL <input id="apiBase" placeholder="https://api.example.com"></label>
            <label>API Key (optional) <input id="apiKey" placeholder="your-api-key"></label>
            <button onclick="registerAPI()">Register API</button>
            <p id="registerMsg"></p>
          </div>

          <!-- Right: List APIs -->
          <div class="card">
            <h2>📋 Registered APIs</h2>
            <ul id="apiList"></ul>
          </div>
        </div>

        <script>
          async function fetchAPIs() {
            const res = await fetch('/api/apis');
            const data = await res.json();
            const list = document.getElementById('apiList');
            list.innerHTML = '';
            for (const [id, api] of Object.entries(data.apis)) {
              const li = document.createElement('li');
              li.textContent = id + " → " + api.name + " (" + api.baseUrl + ")";
              list.appendChild(li);
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

          fetchAPIs(); // load APIs on page load
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
