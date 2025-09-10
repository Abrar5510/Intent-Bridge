// src/core/APILearner.js 
import '../env.js';

import axios from 'axios';
import * as cheerio from 'cheerio';

export class APILearner {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    
    if (!this.apiKey) {
      console.log('⚠️ APILearner: Running without AI (pattern-based learning only)');
      this.useAI = false;
    } else {
      console.log('✅ APILearner: AI-powered learning ready');
      this.useAI = true;
    }
    
    this.learnedAPIs = new Map();
  } 

  async callDeepSeek(messages, systemPrompt = null) { 

    try { 

      const allMessages = []; 

       

      if (systemPrompt) { 

        allMessages.push({ role: 'system', content: systemPrompt }); 

      } 

       

      allMessages.push(...(Array.isArray(messages) ? messages : [messages])); 

       

      const response = await axios.post( 

        `${this.baseUrl}/chat/completions`, 

        { 

          model: 'deepseek-chat', 

          messages: allMessages, 

          temperature: 0.1, 

          max_tokens: 1000, 

          response_format: { type: 'json_object' } 

        }, 

        { 

          headers: { 

            'Authorization': `Bearer ${this.apiKey}`, 

            'Content-Type': 'application/json' 

          } 

        } 

      ); 

 

      return JSON.parse(response.data.choices[0].message.content); 

    } catch (error) { 

      console.error('DeepSeek error:', error.message); 

      throw error; 

    } 

  } 

 

  async learnAPI(input) { 

    console.log(`🧠 Learning new API with DeepSeek: ${input.name || input.url}`); 

     

    try { 

      // Step 1: Identify the API 

      const apiInfo = await this.identifyAPI(input); 

      console.log(`📚 Identified: ${apiInfo.name}`); 

       

      // Step 2: Generate configuration using AI 

      const config = await this.generateSmartConfiguration(apiInfo, input.apiKey); 

      console.log(`⚙️ Generated configuration for ${apiInfo.name}`); 

       

      // Step 3: Store in registry 

      this.storeConfiguration(apiInfo.name, config); 

       

      return { 

        success: true, 

        message: `Successfully learned ${apiInfo.name} API!`, 

        endpoints: Object.keys(config.endpoints), 

        example: `Try: "charge $50 using ${apiInfo.name}" or "get data from ${apiInfo.name}"` 

      }; 

       

    } catch (error) { 

      console.error('Learning failed:', error); 

      return { 

        success: false, 

        error: error.message 

      }; 

    } 

  } 

 

  async identifyAPI(input) { 

    // Common APIs database 

    const knownAPIs = { 

      'stripe': { 

        name: 'Stripe', 

        baseUrl: 'https://api.stripe.com/v1', 

        authType: 'bearer', 

        description: 'Payment processing' 

      }, 

      'twilio': { 

        name: 'Twilio', 

        baseUrl: 'https://api.twilio.com/2010-04-01', 

        authType: 'basic', 

        description: 'SMS and communications' 

      }, 

      'sendgrid': { 

        name: 'SendGrid', 

        baseUrl: 'https://api.sendgrid.com/v3', 

        authType: 'bearer', 

        description: 'Email delivery' 

      }, 

      'razorpay': { 

        name: 'Razorpay', 

        baseUrl: 'https://api.razorpay.com/v1', 

        authType: 'basic', 

        description: 'Payment gateway' 

      }, 

      'easypaisa': { 

        name: 'EasyPaisa', 

        baseUrl: 'https://api.easypaisa.com.pk/v1', 

        authType: 'custom', 

        description: 'Pakistani payment gateway' 

      }, 

      'jazzcash': { 

        name: 'JazzCash', 

        baseUrl: 'https://api.jazzcash.com.pk/v1', 

        authType: 'custom', 

        description: 'Pakistani mobile payments' 

      } 

    }; 

 

    const searchTerm = (input.name || '').toLowerCase(); 

     

    // Check known APIs 

    for (const [key, info] of Object.entries(knownAPIs)) { 

      if (searchTerm.includes(key)) { 

        return info; 

      } 

    } 

 

    // If unknown, ask AI to identify 

    if (!knownAPIs[searchTerm]) { 

      const prompt = { 

        role: 'user', 

        content: `Identify this API and provide details: "${input.name}". Return JSON with: name, baseUrl, authType, description` 

      }; 

       

      try { 

        const result = await this.callDeepSeek([prompt]); 

        return result; 

      } catch (error) { 

        // Default structure 

        return { 

          name: input.name || 'Unknown API', 

          baseUrl: `https://api.${searchTerm}.com/v1`, 

          authType: 'bearer', 

          description: 'External API service' 

        }; 

      } 

    } 

  } 

 

  async generateSmartConfiguration(apiInfo, apiKey) { 

    // Ask DeepSeek to generate common endpoints for this API 

    const systemPrompt = `You are an API expert. Generate common endpoints for APIs based on their type.`; 

     

    const prompt = { 

      role: 'user', 

      content: `Generate a configuration for ${apiInfo.name} API (${apiInfo.description}). 

       

      Return JSON with common endpoints in this format: 

      { 

        "name": "${apiInfo.name}", 

        "baseUrl": "${apiInfo.baseUrl}", 

        "endpoints": { 

          "CREATE_payment": { 

            "method": "POST", 

            "path": "/payments", 

            "description": "Create a payment", 

            "paramMapping": { 

              "amount": "amount", 

              "currency": "currency" 

            } 

          } 

        } 

      } 

       

      Include the most common/useful endpoints for this type of service.` 

    }; 

 

    try { 

      const config = await this.callDeepSeek([prompt], systemPrompt); 

       

      // Add authentication 

      config.authentication = { 

        type: apiInfo.authType, 

        apiKey: apiKey 

      }; 

       

      // Add auth headers to each endpoint 

      for (const key in config.endpoints) { 

        config.endpoints[key].headers = this.getAuthHeaders(apiInfo.authType, apiKey); 

      } 

       

      return config; 

    } catch (error) { 

      // Fallback configuration 

      return this.getDefaultConfig(apiInfo, apiKey); 

    } 

  } 

 

  getDefaultConfig(apiInfo, apiKey) { 

    // Default configuration for unknown APIs 

    const config = { 

      name: apiInfo.name, 

      baseUrl: apiInfo.baseUrl, 

      authentication: { 

        type: apiInfo.authType, 

        apiKey: apiKey 

      }, 

      endpoints: {} 

    }; 

 

    // Add common CRUD endpoints 

    const commonEndpoints = [ 

      { key: 'GET_list', method: 'GET', path: '/', description: 'List all items' }, 

      { key: 'GET_item', method: 'GET', path: '/{id}', description: 'Get single item' }, 

      { key: 'CREATE_item', method: 'POST', path: '/', description: 'Create new item' }, 

      { key: 'UPDATE_item', method: 'PUT', path: '/{id}', description: 'Update item' }, 

      { key: 'DELETE_item', method: 'DELETE', path: '/{id}', description: 'Delete item' } 

    ]; 

 

    for (const endpoint of commonEndpoints) { 

      config.endpoints[endpoint.key] = { 

        method: endpoint.method, 

        path: endpoint.path, 

        description: endpoint.description, 

        headers: this.getAuthHeaders(apiInfo.authType, apiKey), 

        paramMapping: {} 

      }; 

    } 

 

    return config; 

  } 

 

  getAuthHeaders(authType, apiKey) { 

    if (!apiKey) return {}; 

     

    switch (authType) { 

      case 'bearer': 

        return { 'Authorization': `Bearer ${apiKey}` }; 

      case 'basic': 

        return { 'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}` }; 

      case 'apikey': 

        return { 'X-API-Key': apiKey }; 

      case 'custom': 

        return { 'API-Key': apiKey }; 

      default: 

        return { 'Authorization': apiKey }; 

    } 

  } 

 

  storeConfiguration(name, config) { 

    this.learnedAPIs.set(name.toLowerCase(), config); 

     

    // Update global registry 

    if (global.apiRegistry) { 

      global.apiRegistry.register(name.toLowerCase(), config); 

    } 

     

    console.log(`💾 Stored configuration for ${name}`); 

    console.log(`📝 Available endpoints:`, Object.keys(config.endpoints)); 

  } 

} 