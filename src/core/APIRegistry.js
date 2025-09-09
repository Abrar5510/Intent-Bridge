// src/core/APIRegistry.js
export class APIRegistry {
  constructor() {
    this.apis = new Map();
    this.initializeAPIs();
  }

  initializeAPIs() {
    // WEATHER API
    this.register('weather', {
      name: 'OpenWeatherMap',
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      endpoints: {
        GET_weather: {
          method: 'GET',
          path: '/weather',
          paramMapping: { location: 'q', city: 'q', place: 'q' },
          required: ['q'],
          defaultParams: {
            units: 'metric',
            appid: process.env.OPENWEATHER_API_KEY || 'demo'
          }
        },
        GET_forecast: {
          method: 'GET',
          path: '/forecast',
          paramMapping: { location: 'q', city: 'q' },
          required: ['q'],
          defaultParams: {
            units: 'metric',
            appid: process.env.OPENWEATHER_API_KEY || 'demo'
          }
        }
      }
    });

    // NEWS API
    this.register('news', {
      name: 'NewsAPI',
      baseUrl: 'https://newsapi.org/v2',
      endpoints: {
        GET_headlines: {
          method: 'GET',
          path: '/top-headlines',
          paramMapping: { country: 'country', category: 'category', topic: 'q' },
          defaultParams: {
            country: 'us',
            apiKey: process.env.NEWS_API_KEY || 'demo'
          }
        },
        SEARCH_news: {
          method: 'GET',
          path: '/everything',
          paramMapping: { query: 'q', topic: 'q', search: 'q' },
          required: ['q'],
          defaultParams: {
            sortBy: 'popularity',
            apiKey: process.env.NEWS_API_KEY || 'demo'
          }
        }
      }
    });

    // ... (other APIs same as your version)

    console.log(`📚 Registered ${this.apis.size} FREE APIs!`);
  }

  register(key, config) {
    this.apis.set(key, config);
  }

  list() {
    return Array.from(this.apis.keys());
  }

  findAPI(service, action, resource) {
    const config = this.apis.get(service);
    if (!config) return null;

    // Build a lookup key like GET_weather or SEARCH_news
    const endpointKey = `${action}_${resource}`;
    const endpoint = config.endpoints[endpointKey];
    if (!endpoint) return null;

    // Attach endpoint to config for executor
    return { ...config, selectedEndpoint: endpoint };
  }
}
