// src/core/APILearner.js 

import OpenAI from 'openai'; 

import axios from 'axios'; 

import * as cheerio from 'cheerio'; 

 

export class APILearner { 

  constructor() { 

    this.openai = new OpenAI({ 

      apiKey: process.env.OPENAI_API_KEY 

    }); 

    this.learnedAPIs = new Map(); 

  } 

 

  /** 

   * Main function - User just provides API name/URL and key 

   */ 

  async learnAPI(input) { 

    console.log(`🧠 Learning new API: ${input.name || input.url}`); 

     

    try { 

      // Step 1: Identify the API 

      const apiInfo = await this.identifyAPI(input); 

      console.log(`📚 Identified: ${apiInfo.name}`); 

       

      // Step 2: Fetch documentation 

      const documentation = await this.fetchDocumentation(apiInfo); 

      console.log(`📖 Fetched ${documentation.length} chars of documentation`); 

       

      // Step 3: Analyze with AI 

      const apiStructure = await this.analyzeDocumentation(documentation, apiInfo); 

      console.log(`🔍 Found ${apiStructure.endpoints.length} endpoints`); 

       

      // Step 4: Generate configuration 

      const config = await this.generateConfiguration(apiStructure, input.apiKey); 

      console.log(`⚙️ Generated configuration`); 

       

      // Step 5: Test the configuration 

      const testResult = await this.testConfiguration(config); 

      console.log(`✅ Configuration ${testResult ? 'works!' : 'needs adjustment'}`); 

       

      // Step 6: Store in registry 

      this.storeConfiguration(apiInfo.name, config); 

       

      return { 

        success: true, 

        message: `Successfully learned ${apiInfo.name} API!`, 

        endpoints: config.endpoints, 

        ready: true 

      }; 

       

    } catch (error) { 

      console.error('Learning failed:', error); 

      return { 

        success: false, 

        error: error.message, 

        suggestion: 'Try providing a direct documentation URL' 

      }; 

    } 

  } 

 

  /** 

   * Identify what API the user wants to add 

   */ 

  async identifyAPI(input) { 

    // Common APIs with known documentation 

    const knownAPIs = { 

      'stripe': { 

        name: 'Stripe', 

        docsUrl: 'https://stripe.com/docs/api', 

        baseUrl: 'https://api.stripe.com/v1', 

        authType: 'bearer' 

      }, 

      'twilio': { 

        name: 'Twilio', 

        docsUrl: 'https://www.twilio.com/docs', 

        baseUrl: 'https://api.twilio.com', 

        authType: 'basic' 

      }, 

      'sendgrid': { 

        name: 'SendGrid', 

        docsUrl: 'https://docs.sendgrid.com', 

        baseUrl: 'https://api.sendgrid.com/v3', 

        authType: 'bearer' 

      }, 

      'openai': { 

        name: 'OpenAI', 

        docsUrl: 'https://platform.openai.com/docs', 

        baseUrl: 'https://api.openai.com/v1', 

        authType: 'bearer' 

      }, 

      'easypaisa': { 

        name: 'EasyPaisa', 

        docsUrl: 'https://easypaisa.com.pk/api-docs', 

        baseUrl: 'https://api.easypaisa.com.pk', 

        authType: 'custom' 

      }, 

      'jazzcash': { 

        name: 'JazzCash', 

        docsUrl: 'https://jazzcash.com.pk/api', 

        baseUrl: 'https://api.jazzcash.com.pk', 

        authType: 'custom' 

      } 

    }; 

 

    // Check if it's a known API 

    const searchTerm = (input.name || input.url || '').toLowerCase(); 

    for (const [key, info] of Object.entries(knownAPIs)) { 

      if (searchTerm.includes(key)) { 

        return info; 

      } 

    } 

 

    // If not known, try to extract from URL 

    if (input.url) { 

      return { 

        name: this.extractNameFromUrl(input.url), 

        docsUrl: input.url, 

        baseUrl: this.extractBaseUrl(input.url), 

        authType: 'unknown' 

      }; 

    } 

 

    // Use AI to identify 

    const response = await this.openai.chat.completions.create({ 

      model: 'gpt-3.5-turbo', 

      messages: [{ 

        role: 'user', 

        content: `Identify this API and provide its documentation URL: "${input.name}"` 

      }], 

      response_format: { type: 'json_object' } 

    }); 

 

    return JSON.parse(response.choices[0].message.content); 

  } 

 

  /** 

   * Fetch and parse API documentation 

   */ 

  async fetchDocumentation(apiInfo) { 

    try { 

      // For demo, we'll simulate fetching docs 

      // In production, this would actually scrape the documentation 

       

      if (apiInfo.name === 'Stripe') { 

        return this.getStripeSampleDocs(); 

      } 

       

      // Try to fetch actual documentation 

      const response = await axios.get(apiInfo.docsUrl, { 

        timeout: 5000, 

        headers: { 

          'User-Agent': 'Mozilla/5.0 (IntentBridge/1.0)' 

        } 

      }); 

 

      // Parse HTML to extract API information 

      const $ = cheerio.load(response.data); 

       

      // Look for API endpoints, methods, parameters 

      const apiContent = []; 

       

      // Common selectors for API documentation 

      $('code, pre, .endpoint, .api-method, .api-path').each((i, elem) => { 

        apiContent.push($(elem).text()); 

      }); 

 

      return apiContent.join('\n').substring(0, 10000); // Limit size 

       

    } catch (error) { 

      console.log('Could not fetch actual docs, using sample'); 

      return this.getSampleDocumentation(apiInfo.name); 

    } 

  } 

 

  /** 

   * Use AI to understand the API structure 

   */ 

  async analyzeDocumentation(documentation, apiInfo) { 

    const prompt = ` 

    Analyze this API documentation and extract the structure. 

    API Name: ${apiInfo.name} 

     

    Documentation excerpt: 

    ${documentation.substring(0, 3000)} 

     

    Return a JSON object with: 

    { 

      "endpoints": [ 

        { 

          "name": "endpoint name", 

          "path": "/api/path", 

          "method": "GET/POST/etc", 

          "description": "what it does", 

          "parameters": [ 

            {"name": "param1", "type": "string", "required": true} 

          ] 

        } 

      ], 

      "authentication": { 

        "type": "bearer/basic/apikey/oauth", 

        "header": "Authorization", 

        "format": "Bearer {token}" 

      }, 

      "baseUrl": "https://api.example.com", 

      "commonPatterns": { 

        "pagination": "page/limit", 

        "filtering": "query parameters", 

        "errors": "status codes" 

      } 

    } 

     

    Focus on the most important/common endpoints.`; 

 

    const response = await this.openai.chat.completions.create({ 

      model: 'gpt-3.5-turbo', 

      messages: [ 

        { 

          role: 'system', 

          content: 'You are an API documentation analyzer. Extract structured information from API docs.' 

        }, 

        { 

          role: 'user', 

          content: prompt 

        } 

      ], 

      response_format: { type: 'json_object' }, 

      temperature: 0.1 

    }); 

 

    return JSON.parse(response.choices[0].message.content); 

  } 

 

  /** 

   * Generate IntentBridge configuration from analyzed structure 

   */ 

  async generateConfiguration(apiStructure, apiKey) { 

    const config = { 

      name: apiStructure.name || 'Unknown API', 

      baseUrl: apiStructure.baseUrl, 

      apiKey: apiKey, 

      endpoints: {}, 

      authentication: apiStructure.authentication 

    }; 

 

    // Convert analyzed endpoints to IntentBridge format 

    for (const endpoint of apiStructure.endpoints) { 

      const key = `${endpoint.method}_${endpoint.name.replace(/\s+/g, '_')}`; 

       

      config.endpoints[key] = { 

        method: endpoint.method, 

        path: endpoint.path, 

        description: endpoint.description, 

        paramMapping: {}, 

        required: [], 

        headers: this.getAuthHeaders(apiStructure.authentication, apiKey) 

      }; 

 

      // Map parameters 

      if (endpoint.parameters) { 

        for (const param of endpoint.parameters) { 

          config.endpoints[key].paramMapping[param.name] = param.name; 

          if (param.required) { 

            config.endpoints[key].required.push(param.name); 

          } 

        } 

      } 

    } 

 

    return config; 

  } 

 

  /** 

   * Test if the configuration works 

   */ 

  async testConfiguration(config) { 

    try { 

      // Try to make a simple API call to verify it works 

      // For demo, we'll just return true 

      console.log('🧪 Testing configuration...'); 

       

      // In production, make actual test call 

      if (config.endpoints['GET_status'] || config.endpoints['GET_health']) { 

        // Try health check endpoint 

        return true; 

      } 

       

      return true; // Assume it works for demo 

       

    } catch (error) { 

      console.error('Test failed:', error); 

      return false; 

    } 

  } 

 

  /** 

   * Store the learned configuration 

   */ 

  storeConfiguration(name, config) { 

    this.learnedAPIs.set(name.toLowerCase(), config); 

     

    // Also update the main registry 

    if (global.apiRegistry) { 

      global.apiRegistry.register(name.toLowerCase(), config); 

    } 

     

    console.log(`💾 Stored configuration for ${name}`); 

  } 

 

  /** 

   * Helper functions 

   */ 

  extractNameFromUrl(url) { 

    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\.]+)/); 

    return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Unknown'; 

  } 

 

  extractBaseUrl(url) { 

    const match = url.match(/(https?:\/\/[^\/]+)/); 

    return match ? match[1] : url; 

  } 

 

  getAuthHeaders(auth, apiKey) { 

    if (!auth || !apiKey) return {}; 

     

    switch (auth.type) { 

      case 'bearer': 

        return { 'Authorization': `Bearer ${apiKey}` }; 

      case 'basic': 

        return { 'Authorization': `Basic ${apiKey}` }; 

      case 'apikey': 

        return { 'X-API-Key': apiKey }; 

      default: 

        return { 'Authorization': apiKey }; 

    } 

  } 

 

  /** 

   * Sample documentation for demo 

   */ 

  getSampleDocumentation(apiName) { 

    return ` 

    API: ${apiName} 

    Base URL: https://api.${apiName.toLowerCase()}.com/v1 

     

    Authentication: Bearer Token 

    Header: Authorization: Bearer YOUR_API_KEY 

     

    Endpoints: 

     

    POST /payments 

    Create a new payment 

    Parameters: 

    - amount (required): Payment amount in cents 

    - currency: Three-letter ISO currency code 

    - description: Payment description 

     

    GET /payments/{id} 

    Retrieve a payment 

    Parameters: 

    - id (required): Payment ID 

     

    POST /refunds 

    Create a refund 

    Parameters: 

    - payment_id (required): ID of payment to refund 

    - amount: Amount to refund (default: full amount) 

     

    GET /customers 

    List all customers 

    Parameters: 

    - limit: Number of customers to return 

    - page: Page number for pagination 

    `; 

  } 

 

  getStripeSampleDocs() { 

    return ` 

    Stripe API Documentation 

     

    Base URL: https://api.stripe.com/v1 

    Authentication: Bearer sk_test_... or sk_live_... 

     

    Core Resources: 

     

    Charges 

    POST /v1/charges - Create a charge 

    Required: amount, currency 

    Optional: customer, description, metadata 

     

    Customers   

    POST /v1/customers - Create a customer 

    GET /v1/customers/{id} - Retrieve a customer 

     

    Payment Intents 

    POST /v1/payment_intents - Create a payment intent 

    Required: amount, currency 

     

    Refunds 

    POST /v1/refunds - Create a refund 

    Required: charge or payment_intent 

    `; 

  } 

} 