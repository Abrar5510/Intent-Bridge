// src/env.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load from multiple possible locations
const paths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve('.env')
];

let loaded = false;
for (const envPath of paths) {
  console.log(`Trying to load .env from: ${envPath}`);
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`✅ Successfully loaded .env from: ${envPath}`);
    loaded = true;
    break;
  }
}

if (!loaded) {
  console.error('❌ Could not load .env file from any location');
  console.log('Current directory:', process.cwd());
}

// Verify critical environment variables
const required = ['DEEPSEEK_API_KEY'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
}

// Export for verification
export const env = {
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  loaded: loaded,
  path: loaded ? paths.find(p => dotenv.config({ path: p }).parsed) : null
};

console.log('Environment status:', {
  loaded: env.loaded,
  hasDeepSeek: !!env.DEEPSEEK_API_KEY,
  keyPreview: env.DEEPSEEK_API_KEY ? env.DEEPSEEK_API_KEY.substring(0, 20) + '...' : 'NOT SET'
});