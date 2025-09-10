import '../env.js';
import axios from 'axios';

export class IntentParser {
  constructor() {
    // Now use process.env directly (already loaded by env.js)
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    
    console.log('🔧 IntentParser initializing...');
    
    if (!this.apiKey) {
      console.warn('⚠️ DeepSeek API key not found - using fallback parser');
      console.log('   This is OK for demo! Pattern matching still works perfectly.');
      this.useAI = false;
    } else {
      console.log('✅ DeepSeek API configured');
      console.log('   Key:', this.apiKey.substring(0, 15) + '...');
      console.log('   URL:', this.baseUrl);
      this.useAI = true;
    }
    
    this.cache = new Map();
  }

  async parse(intent) {
    // Check cache
    const cached = this.cache.get(intent.toLowerCase());
    if (cached) {
      console.log('📚 Using cached result');
      return cached;
    }

    let parsed;

    // Use DeepSeek for API integration intents, regex for others
    const isAPIIntegration = intent.toLowerCase().includes('integrate') ||
                            (intent.toLowerCase().includes('add') && intent.toLowerCase().includes('api'));

    if (isAPIIntegration && this.useAI) {
      try {
        parsed = await this.parseWithDeepSeek(intent);
      } catch (error) {
        console.error('DeepSeek failed for API integration, using fallback:', error.message);
        parsed = this.parseWithRegex(intent);
      }
    } else {
      // Use regex for regular intents (more reliable for demo)
      parsed = this.parseWithRegex(intent);
    }
    
    // Cache result
    this.cache.set(intent.toLowerCase(), parsed);
    return parsed;
  }

  async parseWithDeepSeek(intent) {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    console.log('🤖 Calling DeepSeek API...');
    
    const messages = [
      {
        role: 'system',
        content: 'You are an intent parser. Extract: action (GET/POST/CREATE/SEND/CHARGE), service (weather/stripe/twilio/etc), resource, and parameters. Return only valid JSON.'
      },
      {
        role: 'user',
        content: `Parse: "${intent}"`
      }
    ];

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: messages,
          temperature: 0.1,
          max_tokens: 200
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      if (response.data && response.data.choices && response.data.choices[0]) {
        const content = response.data.choices[0].message.content;
        console.log('DeepSeek response:', content);
        
        try {
          return JSON.parse(content);
        } catch (parseError) {
          console.error('Failed to parse DeepSeek response:', parseError);
          throw parseError;
        }
      } else {
        throw new Error('Invalid DeepSeek response structure');
      }
    } catch (error) {
      console.error('DeepSeek API error:', error.response?.data || error.message);
      throw error;
    }
  }

  parseWithRegex(intent) {
    const lower = intent.toLowerCase();
    console.log('📝 Using pattern matching for:', lower);
    
    // Integrate/Add API pattern
    if (lower.includes('integrate') || lower.includes('add')) {
      const nameMatch = lower.match(/(?:integrate|add)\s+(\w+)/);
      const keyMatch = lower.match(/key[:\s]+([^\s]+)/);
      
      return {
        action: 'INTEGRATE',
        service: 'system',
        resource: 'api',
        parameters: {
          name: nameMatch ? nameMatch[1] : 'unknown',
          apiKey: keyMatch ? keyMatch[1] : null
        }
      };
    }
    
    // Weather pattern
    if (lower.includes('weather')) {
      const locationMatch = lower.match(/weather\s+(?:in|for|at)?\s*(.+?)(?:\s|$)/);
      return {
        action: 'GET',
        service: 'weather',
        resource: 'forecast',
        parameters: {
          location: locationMatch ? locationMatch[1].trim() : 'London'
        }
      };
    }
    
    // Payment/Charge pattern
    if (lower.includes('charge') || lower.includes('pay')) {
      const amountMatch = lower.match(/\$?(\d+)/);
      const serviceMatch = lower.match(/(?:using|via|with|on)\s+(\w+)/);
      
      return {
        action: 'CHARGE',
        service: serviceMatch ? serviceMatch[1] : 'stripe',
        resource: 'payment',
        parameters: {
          amount: amountMatch ? parseInt(amountMatch[1]) : 50,
          currency: 'USD'
        }
      };
    }
    
    // SMS pattern
    if (lower.includes('sms') || lower.includes('text message')) {
      const messageMatch = lower.match(/(?:saying|with message|text)\s+["']?(.+?)["']?(?:\s+to|\s+using|$)/);
      const phoneMatch = lower.match(/to\s+(\+?\d{10,})/);
      
      return {
        action: 'SEND',
        service: 'twilio',
        resource: 'sms',
        parameters: {
          message: messageMatch ? messageMatch[1] : 'Hello',
          to: phoneMatch ? phoneMatch[1] : '+1234567890'
        }
      };
    }
    
    // News pattern
    if (lower.includes('news')) {
      const topicMatch = lower.match(/news\s+(?:about|on|for)?\s*(.+?)(?:\s|$)/);
      return {
        action: 'GET',
        service: 'news',
        resource: 'headlines',
        parameters: {
          topic: topicMatch ? topicMatch[1] : 'technology'
        }
      };
    }
    
    // Joke pattern
    if (lower.includes('joke')) {
      return {
        action: 'GET',
        service: 'joke',
        resource: 'joke',
        parameters: { type: 'programming' }
      };
    }
    
    // Default fallback
    return {
      action: 'GET',
      service: 'unknown',
      resource: 'data',
      parameters: { query: intent }
    };
  }
}