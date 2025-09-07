// src/core/APIExecutor.js 

import axios from 'axios'; 

 

export class APIExecutor { 

  constructor() { 

    this.useMockMode = !process.env.OPENWEATHER_API_KEY; 

     

    if (this.useMockMode) { 

      console.log('🎭 Running in MOCK mode (no API keys detected)'); 

    } 

  } 

 

  async execute(apiConfig, parameters) { 

    console.log(`🚀 Executing ${apiConfig.name} API...`); 

     

    // For demo/testing, use mock responses if no auth 

    if (this.useMockMode || !this.hasAuth(apiConfig)) { 

      return this.mockExecute(apiConfig, parameters); 

    } 

 

    try { 

      // Map parameters 

      const mappedParams = this.mapParameters( 

        parameters, 

        apiConfig.selectedEndpoint.paramMapping 

      ); 

 

      // Add defaults 

      if (apiConfig.selectedEndpoint.defaultParams) { 

        Object.assign(mappedParams, apiConfig.selectedEndpoint.defaultParams); 

      } 

 

      // Build request 

      const request = { 

        method: apiConfig.selectedEndpoint.method, 

        url: `${apiConfig.baseUrl}${apiConfig.selectedEndpoint.path}`, 

        headers: apiConfig.selectedEndpoint.headers || {} 

      }; 

 

      // Add auth 

      const authHeader = this.getAuthHeader(apiConfig); 

      if (authHeader) { 

        Object.assign(request.headers, authHeader); 

      } 

 

      // Add params 

      if (request.method === 'GET') { 

        request.params = mappedParams; 

      } else { 

        request.data = mappedParams; 

      } 

 

      console.log('📡 Making request:', request.method, request.url); 

 

      // Execute 

      const response = await axios(request); 

 

      return { 

        success: true, 

        data: response.data, 

        service: apiConfig.name, 

        live: true 

      }; 

 

    } catch (error) { 

      console.error('❌ API error:', error.message); 

       

      // Fallback to mock on error 

      return this.mockExecute(apiConfig, parameters); 

    } 

  } 

 

  mockExecute(apiConfig, parameters) { 

    console.log('🎭 Using mock response'); 

     

    const mockResponse = apiConfig.selectedEndpoint.mockResponse || { 

      success: true, 

      message: `Mock ${apiConfig.name} response`, 

      parameters 

    }; 

 

    return { 

      success: true, 

      data: mockResponse, 

      service: apiConfig.name, 

      mock: true 

    }; 

  } 

 

  mapParameters(input, mapping) { 

    const result = {}; 

     

    for (const [key, value] of Object.entries(input)) { 

      const mappedKey = mapping[key] || key; 

      result[mappedKey] = value; 

    } 

     

    return result; 

  } 

 

  hasAuth(apiConfig) { 

    if (!apiConfig.auth || !apiConfig.auth.required) { 

      return true; 

    } 

 

    switch (apiConfig.auth.type) { 

      case 'bearer': 

        return !!process.env.SLACK_TOKEN; 

      case 'oauth2': 

        return !!process.env.TWITTER_TOKEN; 

      case 'token': 

        return !!process.env.GITHUB_TOKEN; 

      case 'apikey': 

        return !!process.env.OPENWEATHER_API_KEY; 

      default: 

        return false; 

    } 

  } 

 

  getAuthHeader(apiConfig) { 

    if (!apiConfig.auth) return null; 

 

    switch (apiConfig.auth.type) { 

      case 'bearer': 

        return { 'Authorization': `Bearer ${process.env.SLACK_TOKEN}` }; 

      case 'oauth2': 

        return { 'Authorization': `Bearer ${process.env.TWITTER_TOKEN}` }; 

      case 'token': 

        return { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }; 

      default: 

        return null; 

    } 

  } 

} 