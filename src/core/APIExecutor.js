// src/core/APIExecutor.js 

import axios from 'axios'; 

import { CequenceGateway } from './CequenceGateway.js'; 

 

export class APIExecutor { 

  constructor() { 

    this.cequence = new CequenceGateway(); 

  } 

 

  async execute(apiConfig, parameters) { 

    console.log(`🚀 Executing ${apiConfig.name} API...`); 

     

    try { 

      // Build the request 

      const request = this.buildRequest(apiConfig, parameters); 

       

      // Execute through Cequence security gateway 

      console.log('📡 Making secure API call...'); 

      const response = await this.cequence.secureRequest(request); 

       

      return { 

        success: true, 

        data: response.data, 

        service: apiConfig.name, 

        secure: true, 

        timestamp: new Date().toISOString() 

      }; 

       

    } catch (error) { 

      console.error('API Error:', error.message); 

       

      // Return mock data for demo if API fails 

      return this.getMockResponse(apiConfig.name, parameters); 

    } 

  } 

 

  buildRequest(apiConfig, parameters) { 

    const endpoint = apiConfig.endpoints[Object.keys(apiConfig.endpoints)[0]]; 

    let url = `${apiConfig.baseUrl}${endpoint.path}`; 

     

    // Replace path parameters 

    for (const [key, value] of Object.entries(parameters)) { 

      url = url.replace(`{${key}}`, value); 

    } 

     

    const request = { 

      method: endpoint.method, 

      url: url, 

      headers: endpoint.headers || {} 

    }; 

     

    // Add parameters 

    if (endpoint.method === 'GET') { 

      request.params = { ...endpoint.defaultParams, ...parameters }; 

    } else { 

      request.data = { ...endpoint.defaultParams, ...parameters }; 

    } 

     

    return request; 

  } 

 

  getMockResponse(service, parameters) { 

    const mockResponses = { 

      'OpenWeatherMap': { 

        name: parameters.location || 'New York', 

        main: { temp: 22, humidity: 65 }, 

        weather: [{ description: 'partly cloudy' }], 

        wind: { speed: 10 } 

      }, 

      'NewsAPI': { 

        articles: [ 

          { 

            title: 'Breaking: AI Agents Get Secure API Access', 

            description: 'IntentBridge enables secure API access for AI agents', 

            source: { name: 'Tech News' }, 

            url: 'https://example.com' 

          } 

        ] 

      }, 

      'ExchangeRate': { 

        base: 'USD', 

        rates: { 

          EUR: 0.85, 

          GBP: 0.73, 

          JPY: 110.5 

        } 

      }, 

      'JokeAPI': { 

        joke: "Why do programmers prefer dark mode? Because light attracts bugs!" 

      }, 

      'GitHub': { 

        login: parameters.username || 'octocat', 

        public_repos: 42, 

        followers: 1000 

      } 

    }; 

     

    return { 

      success: true, 

      data: mockResponses[service] || { message: 'Mock response' }, 

      service: service, 

      mock: true 

    }; 

  } 

} 