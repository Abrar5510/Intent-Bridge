
import axios from 'axios'; 

export class APIRegistry { 

  constructor() { 

    this.apis = new Map(); 

    this.initializeAPIs(); 

  } 

 

  initializeAPIs() { 

    // 1. WEATHER API (OpenWeatherMap - FREE) 

    this.register('weather', { 

      name: 'OpenWeatherMap', 

      baseUrl: 'https://api.openweathermap.org/data/2.5', 

      endpoints: { 

        'GET_weather': { 

          method: 'GET', 

          path: '/weather', 

          paramMapping: { 

            'location': 'q', 

            'city': 'q', 

            'place': 'q' 

          }, 

          required: ['q'], 

          defaultParams: { 

            units: 'metric', 

            appid: process.env.OPENWEATHER_API_KEY || 'demo' 

          } 

        }, 

        'GET_forecast': { 

          method: 'GET', 

          path: '/forecast', 

          paramMapping: { 

            'location': 'q', 

            'city': 'q' 

          }, 

          required: ['q'], 

          defaultParams: { 

            units: 'metric', 

            appid: process.env.OPENWEATHER_API_KEY || 'demo' 

          } 

        } 

      } 

    }); 

 

    // 2. NEWS API (NewsAPI.org - FREE) 

    this.register('news', { 

      name: 'NewsAPI', 

      baseUrl: 'https://newsapi.org/v2', 

      endpoints: { 

        'GET_headlines': { 

          method: 'GET', 

          path: '/top-headlines', 

          paramMapping: { 

            'country': 'country', 

            'category': 'category', 

            'topic': 'q' 

          }, 

          defaultParams: { 

            country: 'us', 

            apiKey: process.env.NEWS_API_KEY || 'demo' 

          } 

        }, 

        'SEARCH_news': { 

          method: 'GET', 

          path: '/everything', 

          paramMapping: { 

            'query': 'q', 

            'topic': 'q', 

            'search': 'q' 

          }, 

          required: ['q'], 

          defaultParams: { 

            sortBy: 'popularity', 

            apiKey: process.env.NEWS_API_KEY || 'demo' 

          } 

        } 

      } 

    }); 

 

    // 3. CURRENCY EXCHANGE (ExchangeRate-API - FREE) 

    this.register('currency', { 

      name: 'ExchangeRate', 

      baseUrl: 'https://api.exchangerate-api.com/v4', 

      endpoints: { 

        'GET_rate': { 

          method: 'GET', 

          path: '/latest/USD', 

          paramMapping: { 

            'from': 'base', 

            'currency': 'base' 

          } 

        } 

      } 

    }); 

 

    // 4. JOKES API (JokeAPI - FREE, No Key Needed!) 

    this.register('joke', { 

      name: 'JokeAPI', 

      baseUrl: 'https://v2.jokeapi.dev', 

      endpoints: { 

        'GET_joke': { 

          method: 'GET', 

          path: '/joke/Any', 

          paramMapping: { 

            'type': 'type', 

            'category': 'category' 

          }, 

          defaultParams: { 

            safe: true, 

            type: 'single' 

          } 

        } 

      } 

    }); 

 

    // 5. GITHUB API (Public - FREE, No Auth!) 

    this.register('github', { 

      name: 'GitHub', 

      baseUrl: 'https://api.github.com', 

      endpoints: { 

        'GET_user': { 

          method: 'GET', 

          path: '/users/{username}', 

          paramMapping: { 

            'username': 'username', 

            'user': 'username' 

          } 

        }, 

        'GET_repos': { 

          method: 'GET', 

          path: '/users/{username}/repos', 

          paramMapping: { 

            'username': 'username', 

            'user': 'username' 

          }, 

          defaultParams: { 

            sort: 'updated', 

            per_page: 10 

          } 

        } 

      } 

    }); 

 

    // 6. RANDOM FACTS (FREE, No Key!) 

    this.register('facts', { 

      name: 'UselessFacts', 

      baseUrl: 'https://uselessfacts.jsph.pl', 

      endpoints: { 

        'GET_fact': { 

          method: 'GET', 

          path: '/api/v2/facts/random', 

          paramMapping: {}, 

          defaultParams: { 

            language: 'en' 

          } 

        } 

      } 

    }); 

 

    // 7. DICTIONARY API (FREE, No Key!) 

    this.register('dictionary', { 

      name: 'DictionaryAPI', 

      baseUrl: 'https://api.dictionaryapi.dev/api/v2', 

      endpoints: { 

        'GET_definition': { 

          method: 'GET', 

          path: '/entries/en/{word}', 

          paramMapping: { 

            'word': 'word', 

            'define': 'word', 

            'meaning': 'word' 

          } 

        } 

      } 

    }); 

 

    // 8. IP GEOLOCATION (FREE Tier) 

    this.register('ip', { 

      name: 'IPGeolocation', 

      baseUrl: 'https://ipapi.co', 

      endpoints: { 

        'GET_location': { 

          method: 'GET', 

          path: '/{ip}/json', 

          paramMapping: { 

            'ip': 'ip', 

            'address': 'ip' 

          }, 

          defaultParams: {} 

        } 

      } 

    }); 

 

    console.log(`📚 Registered ${this.apis.size} FREE APIs!`); 

  } 

 

  // ... rest of your code 

} 
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