// src/core/ResponseNormalizer.js 

export class ResponseNormalizer { 

    normalize(service, data) { 
  
      if (!data) { 
  
        return { 
  
          type: 'empty', 
  
          service: service, 
  
          message: 'No data returned', 
  
          timestamp: new Date().toISOString() 
  
        }; 
  
      } 
  
   
  
      const normalizers = { 
  
        'weather': this.normalizeWeather.bind(this), 
  
        'openweathermap': this.normalizeWeather.bind(this), 
  
        'news': this.normalizeNews.bind(this), 
  
        'newsapi': this.normalizeNews.bind(this), 
  
        'currency': this.normalizeCurrency.bind(this), 
  
        'exchangerate': this.normalizeCurrency.bind(this), 
  
        'joke': this.normalizeJoke.bind(this), 
  
        'jokeapi': this.normalizeJoke.bind(this), 
  
        'github': this.normalizeGitHub.bind(this), 
  
        'stripe': this.normalizeStripe.bind(this), 
  
        'twilio': this.normalizeTwilio.bind(this), 
  
        'sendgrid': this.normalizeSendGrid.bind(this), 
  
        'razorpay': this.normalizeRazorpay.bind(this), 
  
        'easypaisa': this.normalizeEasyPaisa.bind(this), 
  
        'jazzcash': this.normalizeJazzCash.bind(this) 
  
      }; 
  
   
  
      const normalizer = normalizers[service.toLowerCase()] || this.defaultNormalize.bind(this); 
  
       
  
      try { 
  
        const normalized = normalizer(data); 
  
        return { 
  
          ...normalized, 
  
          timestamp: new Date().toISOString(), 
  
          service: service 
  
        }; 
  
      } catch (error) { 
  
        console.error('Normalization error:', error); 
  
        return this.defaultNormalize(data); 
  
      } 
  
    } 
  
   
  
    normalizeWeather(data) { 
  
      const temp = Math.round(data.main?.temp || 0); 
  
      const location = data.name || 'Unknown'; 
  
      const description = data.weather?.[0]?.description || 'Unknown'; 
  
       
  
      return { 
  
        type: 'weather', 
  
        platform: 'OpenWeatherMap', 
  
        location: location, 
  
        temperature: `${temp}°C`, 
  
        description: description, 
  
        humidity: `${data.main?.humidity || 0}%`, 
  
        wind: `${data.wind?.speed || 0} m/s`, 
  
        summary: `${temp}°C and ${description} in ${location}`, 
  
        raw: data 
  
      }; 
  
    } 
  
   
  
    normalizeNews(data) { 
  
      const articles = data.articles || []; 
  
      return { 
  
        type: 'news', 
  
        platform: 'NewsAPI', 
  
        totalResults: data.totalResults || articles.length, 
  
        articles: articles.slice(0, 5).map(article => ({ 
  
          title: article.title, 
  
          description: article.description, 
  
          source: article.source?.name, 
  
          url: article.url, 
  
          publishedAt: article.publishedAt 
  
        })), 
  
        summary: `Found ${articles.length} news articles` 
  
      }; 
  
    } 
  
   
  
    normalizeCurrency(data) { 
  
      const base = data.base || 'USD'; 
  
      const rates = data.rates || {}; 
  
       
  
      return { 
  
        type: 'currency', 
  
        platform: 'ExchangeRate', 
  
        base: base, 
  
        rates: rates, 
  
        summary: `Exchange rates for ${base}`, 
  
        topRates: Object.entries(rates).slice(0, 5).map(([currency, rate]) =>  
  
          `${currency}: ${rate}` 
  
        ).join(', ') 
  
      }; 
  
    } 
  
   
  
    normalizeJoke(data) { 
  
      const joke = data.joke || data.setup  
  
        ? `${data.setup} - ${data.delivery}`  
  
        : 'No joke available'; 
  
       
  
      return { 
  
        type: 'entertainment', 
  
        platform: 'JokeAPI', 
  
        content: joke, 
  
        category: data.category || 'general', 
  
        summary: joke 
  
      }; 
  
    } 
  
   
  
    normalizeGitHub(data) { 
  
      if (Array.isArray(data)) { 
  
        // Repository list 
  
        return { 
  
          type: 'repositories', 
  
          platform: 'GitHub', 
  
          count: data.length, 
  
          repos: data.slice(0, 5).map(repo => ({ 
  
            name: repo.name, 
  
            description: repo.description, 
  
            stars: repo.stargazers_count, 
  
            url: repo.html_url 
  
          })), 
  
          summary: `Found ${data.length} repositories` 
  
        }; 
  
      } else { 
  
        // Single user/repo 
  
        return { 
  
          type: 'github_resource', 
  
          platform: 'GitHub', 
  
          name: data.name || data.login, 
  
          description: data.description || data.bio, 
  
          url: data.html_url, 
  
          public_repos: data.public_repos, 
  
          followers: data.followers, 
  
          summary: `GitHub ${data.type || 'resource'}: ${data.name || data.login}` 
  
        }; 
  
      } 
  
    } 
  
   
  
    normalizeStripe(data) { 
  
      return { 
  
        type: 'payment', 
  
        platform: 'Stripe', 
  
        id: data.id, 
  
        amount: data.amount ? `$${(data.amount / 100).toFixed(2)}` : 'N/A', 
  
        currency: data.currency?.toUpperCase(), 
  
        status: data.status, 
  
        description: data.description, 
  
        summary: `Payment ${data.id} - ${data.status}` 
  
      }; 
  
    } 
  
   
  
    normalizeTwilio(data) { 
  
      return { 
  
        type: 'communication', 
  
        platform: 'Twilio', 
  
        sid: data.sid, 
  
        to: data.to, 
  
        from: data.from, 
  
        body: data.body, 
  
        status: data.status, 
  
        summary: `SMS to ${data.to}: ${data.status}` 
  
      }; 
  
    } 
  
   
  
    normalizeSendGrid(data) { 
  
      return { 
  
        type: 'email', 
  
        platform: 'SendGrid', 
  
        messageId: data.message_id, 
  
        to: data.to, 
  
        from: data.from, 
  
        subject: data.subject, 
  
        status: 'sent', 
  
        summary: `Email sent to ${data.to}` 
  
      }; 
  
    } 
  
   
  
    normalizeRazorpay(data) { 
  
      return { 
  
        type: 'payment', 
  
        platform: 'Razorpay', 
  
        id: data.id, 
  
        amount: data.amount ? `₹${(data.amount / 100).toFixed(2)}` : 'N/A', 
  
        currency: data.currency, 
  
        status: data.status, 
  
        summary: `Razorpay payment ${data.id}` 
  
      }; 
  
    } 
  
   
  
    normalizeEasyPaisa(data) { 
  
      return { 
  
        type: 'payment', 
  
        platform: 'EasyPaisa', 
  
        transactionId: data.transactionId || data.orderId, 
  
        amount: data.amount ? `PKR ${data.amount}` : 'N/A', 
  
        msisdn: data.msisdn, 
  
        status: data.status || 'initiated', 
  
        summary: `EasyPaisa payment to ${data.msisdn}` 
  
      }; 
  
    } 
  
   
  
    normalizeJazzCash(data) { 
  
      return { 
  
        type: 'payment', 
  
        platform: 'JazzCash', 
  
        referenceNo: data.pp_TxnRefNo || data.transactionId, 
  
        amount: data.pp_Amount ? `PKR ${data.pp_Amount / 100}` : 'N/A', 
  
        responseCode: data.pp_ResponseCode, 
  
        message: data.pp_ResponseMessage, 
  
        summary: `JazzCash transaction ${data.pp_TxnRefNo}` 
  
      }; 
  
    } 
  
   
  
    defaultNormalize(data) { 
  
      // For unknown APIs, try to extract meaningful info 
  
      return { 
  
        type: 'api_response', 
  
        platform: 'External API', 
  
        success: data.success !== undefined ? data.success : true, 
  
        data: data, 
  
        summary: this.extractSummary(data) 
  
      }; 
  
    } 
  
   
  
    extractSummary(data) { 
  
      if (typeof data === 'string') return data.substring(0, 100); 
  
      if (data.message) return data.message; 
  
      if (data.status) return `Status: ${data.status}`; 
  
      if (data.result) return `Result: ${JSON.stringify(data.result).substring(0, 100)}`; 
  
      return 'API call completed'; 
  
    } 
  
  } 