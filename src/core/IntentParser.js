// src/core/IntentParser.js 

import axios from 'axios'; 

 

export class IntentParser { 

  constructor() { 

    this.apiKey = process.env.DEEPSEEK_API_KEY; 

    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'; 

     

    if (!this.apiKey) { 

      console.warn('⚠️ DeepSeek API key not found, using fallback parser'); 

      this.useAI = false; 

    } else { 

      this.useAI = true; 

      console.log('✅ DeepSeek AI Parser initialized'); 

    } 

     

    this.cache = new Map(); 

  } 

 

  async parse(intent) { 

    // Check cache first 

    const cached = this.cache.get(intent.toLowerCase()); 

    if (cached) { 

      console.log('📚 Using cached parse result'); 

      return cached; 

    } 

 

    let parsed; 

     

    if (this.useAI) { 

      parsed = await this.parseWithDeepSeek(intent); 

    } else { 

      parsed = this.parseWithRegex(intent); 

    } 

     

    // Cache the result 

    this.cache.set(intent.toLowerCase(), parsed); 

     

    return parsed; 

  } 

 

  async parseWithDeepSeek(intent) { 

    const systemPrompt = `You are an intent parser for API calls. Parse the user's intent into structured JSON. 

 

Return ONLY a JSON object with these fields: 

- action: One of GET, POST, CREATE, UPDATE, DELETE, SEND, FETCH, CHARGE, CONVERT 

- service: The service name (weather, news, currency, github, stripe, etc.) 

- resource: What resource to act on (forecast, headlines, payment, repository, etc.) 

- parameters: Key-value pairs of data needed 

 

Examples: 

Input: "get weather in Tokyo" 

Output: {"action":"GET","service":"weather","resource":"forecast","parameters":{"location":"Tokyo"}} 

 

Input: "charge $50 using Stripe" 

Output: {"action":"CHARGE","service":"stripe","resource":"payment","parameters":{"amount":50,"currency":"USD"}} 

 

Input: "send message Hello to Slack" 

Output: {"action":"SEND","service":"slack","resource":"message","parameters":{"text":"Hello"}}`; 

 

    try { 

      const response = await axios.post( 

        `${this.baseUrl}/chat/completions`, 

        { 

          model: 'deepseek-chat', 

          messages: [ 

            { role: 'system', content: systemPrompt }, 

            { role: 'user', content: `Parse this intent: "${intent}"` } 

          ], 

          temperature: 0.1, 

          max_tokens: 200, 

          response_format: { type: 'json_object' } 

        }, 

        { 

          headers: { 

            'Authorization': `Bearer ${this.apiKey}`, 

            'Content-Type': 'application/json' 

          } 

        } 

      ); 

 

      const parsed = JSON.parse(response.data.choices[0].message.content); 

      console.log('🤖 DeepSeek parsed:', parsed); 

      return parsed; 

       

    } catch (error) { 

      console.error('DeepSeek parse error:', error.message); 

      // Fallback to regex parsing 

      return this.parseWithRegex(intent); 

    } 

  } 

 

  parseWithRegex(intent) { 

    const lower = intent.toLowerCase(); 

    console.log('📝 Using regex parser for:', lower); 

     

    // Enhanced regex patterns for better matching 

    const patterns = [ 

      // Weather patterns 

      { 

        regex: /(?:get|check|what's|fetch|show)\s*(?:the)?\s*weather\s*(?:in|for|at)?\s*(.+)/i, 

        action: 'GET', 

        service: 'weather', 

        resource: 'forecast', 

        extract: (match) => ({ location: match[1]?.trim() || 'London' }) 

      }, 

      // Payment patterns 

      { 

        regex: /(?:charge|pay|process)\s*(?:\$|usd|dollars?)?\s*(\d+)\s*(?:using|via|through|with)?\s*(\w+)?/i, 

        action: 'CHARGE', 

        service: (match) => match[2]?.toLowerCase() || 'stripe', 

        resource: 'payment', 

        extract: (match) => ({ amount: parseInt(match[1]), currency: 'USD' }) 

      }, 

      // Integrate API patterns 

      { 

        regex: /(?:integrate|add|learn|setup)\s+(\w+)\s*(?:api)?(?:.*key[:\s]+([^\s]+))?/i, 

        action: 'INTEGRATE', 

        service: 'system', 

        resource: 'api', 

        extract: (match) => ({  

          name: match[1],  

          apiKey: match[2] || null  

        }) 

      }, 

      // News patterns 

      { 

        regex: /(?:get|fetch|show|find)\s*(?:latest|top|recent)?\s*news\s*(?:about|on|for)?\s*(.+)?/i, 

        action: 'GET', 

        service: 'news', 

        resource: 'headlines', 

        extract: (match) => ({ topic: match[1]?.trim() || 'technology' }) 

      }, 

      // Currency patterns 

      { 

        regex: /(?:convert|exchange)\s*(\d+)?\s*(\w+)\s*(?:to|into)\s*(\w+)/i, 

        action: 'CONVERT', 

        service: 'currency', 

        resource: 'rate', 

        extract: (match) => ({ 

          amount: parseInt(match[1]) || 1, 

          from: match[2]?.toUpperCase() || 'USD', 

          to: match[3]?.toUpperCase() || 'EUR' 

        }) 

      }, 

      // GitHub patterns 

      { 

        regex: /(?:check|get|show)\s*github\s*(?:user|repo|repository)?\s*(.+)/i, 

        action: 'GET', 

        service: 'github', 

        resource: 'user', 

        extract: (match) => ({ username: match[1]?.trim() || 'octocat' }) 

      }, 

      // Joke patterns 

      { 

        regex: /(?:tell|get|show)\s*(?:me)?\s*(?:a)?\s*joke/i, 

        action: 'GET', 

        service: 'joke', 

        resource: 'joke', 

        extract: () => ({ type: 'programming' }) 

      } 

    ]; 

 

    // Try each pattern 

    for (const pattern of patterns) { 

      const match = lower.match(pattern.regex); 

      if (match) { 

        const service = typeof pattern.service === 'function'  

          ? pattern.service(match)  

          : pattern.service; 

           

        return { 

          action: pattern.action, 

          service: service, 

          resource: pattern.resource, 

          parameters: pattern.extract(match) 

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