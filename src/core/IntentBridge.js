// src/core/IntentBridge.js 

import { IntentParser } from './IntentParser.js'; 

import { APIRegistry } from './APIRegistry.js'; 

import { APIExecutor } from './APIExecutor.js'; 

import { LearningEngine } from './LearningEngine.js'; 

import { ResponseNormalizer } from './ResponseNormalizer.js'; 

 

export class IntentBridge { 

  constructor() { 

    console.log('🌉 Initializing IntentBridge...'); 

     

    this.parser = new IntentParser(); 

    this.registry = new APIRegistry(); 

    this.executor = new APIExecutor(); 

    this.learner = new LearningEngine(); 

    this.normalizer = new ResponseNormalizer(); 

     

    console.log('✅ IntentBridge ready!'); 

  } 

 

  async execute(intent) { 

    const startTime = Date.now(); 

     

    console.log(`\n${'='.repeat(50)}`); 

    console.log(`🎯 Intent: "${intent}"`); 
    // Check for learned pattern 

    const learned = this.learner.checkPattern(intent); 

    if (learned) { 

      console.log('⚡ Using learned pattern (fast path)'); 

      // Recreate the API config from learned data 

      const apiConfig = this.registry.findAPI( 

        learned.parsed.service, 

        learned.parsed.action, 

        learned.parsed.resource 

      ); 

       

      if (apiConfig) { 

        const result = await this.executor.execute(apiConfig, learned.parsed.parameters); 

        const responseTime = Date.now() - startTime; 

         

        await this.learner.recordExecution( 

          intent, 

          learned.parsed, 

          apiConfig, 

          result, 

          responseTime 

        ); 

         

        if (result.success && result.data) { 

          result.normalized = this.normalizer.normalize(apiConfig.name, result.data); 

        } 

         

        console.log(`⏱️ Execution time: ${responseTime}ms`); 

        return this.formatResponse(result, responseTime); 

      } 

    } 

 

    try { 

      // Step 1: Parse the intent 

      console.log('🧠 Parsing intent...'); 

      const parsed = await this.parser.parse(intent); 

      console.log('📋 Parsed:', JSON.stringify(parsed, null, 2)); 

 

      // Step 2: Find matching API 

      console.log('🔍 Finding API...'); 

      const apiConfig = this.registry.findAPI( 

        parsed.service, 

        parsed.action, 

        parsed.resource 

      ); 

 

      if (!apiConfig) { 

        const available = this.registry.list(); 

        return { 

          success: false, 

          error: `API not found: ${parsed.service}`, 

          suggestion: `Try one of: ${available.join(', ')}`, 

          available_apis: available 

        }; 

      } 

 

      console.log(`✅ Found API: ${apiConfig.name}`); 

 

      // Step 3: Execute API call 

      const result = await this.executor.execute(apiConfig, parsed.parameters); 

 

      // Step 4: Record for learning 

      const responseTime = Date.now() - startTime; 

      await this.learner.recordExecution( 

        intent, 

        parsed, 

        apiConfig, 

        result, 

        responseTime 

      ); 

 

      // Step 5: Normalize response 

      if (result.success && result.data) { 

        result.normalized = this.normalizer.normalize(apiConfig.name, result.data); 

      } 

 

      console.log(`⏱️ Execution time: ${responseTime}ms`); 

      return this.formatResponse(result, responseTime); 

 

    } catch (error) { 

      console.error('❌ Error:', error.message); 

      return { 

        success: false, 

        error: error.message, 

        stack: error.stack 

      }; 

    } 

  } 

 

  formatResponse(result, responseTime) { 

    if (result.success && result.normalized) { 

      return { 

        success: true, 

        message: this.generateReadableMessage(result.normalized), 

        data: result.normalized, 

        raw: result.data, 

        mock: result.mock || false, 

        executionTime: `${responseTime}ms`, 

        service: result.service 

      }; 

    } 

     

    return result; 

  } 

 

  generateReadableMessage(normalized) { 

    switch (normalized.type) { 

      case 'social_post': 

        return `✅ Posted to ${normalized.platform}: "${normalized.content}"`; 

       

      case 'message': 

        return `✅ Sent message to ${normalized.platform}: "${normalized.content}"`; 

       

      case 'weather': 

        return `🌤️ Weather in ${normalized.location}: ${normalized.summary}`; 

       

      case 'repository': 

        return `✅ Created GitHub repository: ${normalized.name} - ${normalized.url}`; 

       

      default: 

        return '✅ Operation completed successfully'; 

    } 

  } 

 

  listAPIs() { 

    return this.registry.list(); 

  } 

 

  getStats() { 

    return this.learner.getStats(); 

  } 

} 