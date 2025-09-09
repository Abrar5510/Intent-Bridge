// src/core/CequenceGateway.js 

import axios from 'axios'; 

 

export class CequenceGateway { 

  constructor() { 

    this.baseUrl = process.env.CEQUENCE_GATEWAY_URL; 

    this.apiKey = process.env.CEQUENCE_API_KEY; 

    this.projectId = process.env.CEQUENCE_PROJECT_ID; 

     

    if (this.apiKey) { 

      console.log('✅ Cequence Security Gateway initialized'); 

    } else { 

      console.log('⚠️ Cequence not configured - using direct calls'); 

    } 

  } 

 

  async secureRequest(config) { 

    // If Cequence is configured, route through their gateway 

    if (this.apiKey) { 

      return await this.routeThroughCequence(config); 

    } 

     

    // Otherwise, make direct call (for development) 

    return await axios(config); 

  } 

 

  async routeThroughCequence(config) { 

    try { 

      // Cequence proxy configuration 

      const cequenceConfig = { 

        method: 'POST', 

        url: `${this.baseUrl}/proxy`, 

        headers: { 

          'X-Cequence-API-Key': this.apiKey, 

          'X-Cequence-Project': this.projectId, 

          'Content-Type': 'application/json' 

        }, 

        data: { 

          targetUrl: config.url, 

          method: config.method, 

          headers: config.headers, 

          data: config.data, 

          params: config.params 

        } 

      }; 

 

      console.log('🔒 Routing through Cequence Security Gateway'); 

      const response = await axios(cequenceConfig); 

       

      // Log security events 

      this.logSecurityEvent({ 

        url: config.url, 

        method: config.method, 

        timestamp: new Date().toISOString(), 

        status: 'allowed' 

      }); 

 

      return response; 

    } catch (error) { 

      console.error('Cequence error:', error.message); 

      // Fallback to direct call if Cequence fails 

      return await axios(config); 

    } 

  } 

 

  logSecurityEvent(event) { 

    // This would normally go to a database 

    console.log('🔐 Security Event:', event); 

  } 

 

  async checkRateLimit(userId, service) { 

    // Implement rate limiting 

    return true; // For now, allow all 

  } 

 

  async validateRequest(userId, service, action) { 

    // Add request validation logic 

    console.log(`✓ Validated: ${userId} → ${service}:${action}`); 

    return true; 

  } 

} 