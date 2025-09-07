// src/core/IntentParser.js 

import OpenAI from 'openai'; 

 

export class IntentParser { 

  constructor() { 

    if (!process.env.OPENAI_API_KEY) { 

      console.warn('⚠️ OpenAI API key not found, using fallback parser'); 

      this.useOpenAI = false; 

    } else { 

      this.openai = new OpenAI({ 

        apiKey: process.env.OPENAI_API_KEY 

      }); 

      this.useOpenAI = true; 

    } 

     

    this.cache = new Map(); 

  } 

 

  async parse(intent) { 

    // Check cache 

    const cached = this.cache.get(intent.toLowerCase()); 

    if (cached) { 

      console.log('📚 Using cached parse result'); 

      return cached; 

    } 

 

    let parsed; 

     

    if (this.useOpenAI) { 

      parsed = await this.parseWithAI(intent); 

    } else { 

      parsed = this.parseWithRegex(intent); 

    } 

     

    // Cache result 

    this.cache.set(intent.toLowerCase(), parsed); 

     

    return parsed; 

  } 

 

  async parseWithAI(intent) { 

    const systemPrompt = `You are an intent parser for API calls. Parse the user's intent into a structured format. 

 

Return a JSON object with: 

- action: GET, POST, CREATE, UPDATE, DELETE, SEND, FETCH 

- service: twitter, slack, github, weather, email, calendar, etc. 

- resource: message, post, repo, forecast, etc. 

- parameters: key-value pairs of data 

 

Examples: 

"post hello world to twitter" → {"action":"CREATE","service":"twitter","resource":"post","parameters":{"text":"hello world"}} 

"get weather in New York" → {"action":"GET","service":"weather","resource":"forecast","parameters":{"location":"New York"}} 

"send message saying hi to slack channel general" → {"action":"SEND","service":"slack","resource":"message","parameters":{"text":"hi","channel":"general"}}`; 

 

    try { 

      const response = await this.openai.chat.completions.create({ 

        model: 'gpt-3.5-turbo-0125', 

        messages: [ 

          { role: 'system', content: systemPrompt }, 

          { role: 'user', content: intent } 

        ], 

        response_format: { type: 'json_object' }, 

        temperature: 0, 

        max_tokens: 150 

      }); 

 

      const parsed = JSON.parse(response.choices[0].message.content); 

      console.log('🤖 AI parsed:', parsed); 

      return parsed; 

       

    } catch (error) { 

      console.error('AI parse error:', error.message); 

      return this.parseWithRegex(intent); 

    } 

  } 

 

  parseWithRegex(intent) { 

    const lower = intent.toLowerCase(); 

     

    // Pattern matching for common intents 

    const patterns = [ 

      { 

        regex: /(?:post|tweet|share)\s+(?:["'](.+?)["']|(.+?))\s+(?:to|on)\s+twitter/i, 

        service: 'twitter', 

        action: 'CREATE', 

        resource: 'post', 

        extractText: true 

      }, 

      { 

        regex: /(?:send|message)\s+(?:["'](.+?)["']|(.+?))\s+to\s+slack(?:\s+channel\s+)?(?:#)?(\w+)?/i, 

        service: 'slack', 

        action: 'SEND', 

        resource: 'message', 

        extractText: true, 

        extractChannel: true 

      }, 

      { 

        regex: /(?:get|check|what's|fetch)\s+(?:the\s+)?weather\s+(?:in|for|at)\s+(.+)/i, 

        service: 'weather', 

        action: 'GET', 

        resource: 'forecast', 

        extractLocation: true 

      }, 

      { 

        regex: /create\s+(?:a\s+)?(?:github\s+)?repo(?:sitory)?\s+(?:called\s+)?(.+)/i, 

        service: 'github', 

        action: 'CREATE', 

        resource: 'repository', 

        extractName: true 

      } 

    ]; 

 

    for (const pattern of patterns) { 

      const match = lower.match(pattern.regex); 

      if (match) { 

        const parameters = {}; 

         

        if (pattern.extractText) { 

          parameters.text = match[1] || match[2] || 'Hello from IntentBridge!'; 

        } 

        if (pattern.extractChannel && match[3]) { 

          parameters.channel = match[3]; 

        } 

        if (pattern.extractLocation) { 

          parameters.location = match[1]; 

        } 

        if (pattern.extractName) { 

          parameters.name = match[1]; 

        } 

         

        return { 

          action: pattern.action, 

          service: pattern.service, 

          resource: pattern.resource, 

          parameters 

        }; 

      } 

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