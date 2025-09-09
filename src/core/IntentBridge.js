// src/core/IntentBridge.js

import { IntentParser } from './IntentParser.js';
import { APIRegistry } from './APIRegistry.js';
import { APIExecutor } from './APIExecutor.js';
import { LearningEngine } from './LearningEngine.js';
import { ResponseNormalizer } from './ResponseNormalizer.js';
import { APILearner } from './APILearner.js';

export class IntentBridge {
  constructor() {
    console.log('🌉 Initializing IntentBridge...');

    this.parser = new IntentParser();
    this.registry = new APIRegistry();
    this.executor = new APIExecutor();
    this.learner = new LearningEngine();
    this.normalizer = new ResponseNormalizer();
    this.apiLearner = new APILearner();

    // Make registry globally accessible for learner
    global.apiRegistry = this.registry;

    console.log('✅ IntentBridge ready with Auto-Learning!');
  }

  async execute(intent) {
    const startTime = Date.now();

    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎯 Intent: "${intent}"`);

    // Check if user wants to add a new API
    if (
      intent.toLowerCase().includes('integrate') ||
      (intent.toLowerCase().includes('add') && intent.toLowerCase().includes('api'))
    ) {
      return await this.handleAPIIntegration(intent);
    }

    // Check for learned pattern
    const learned = this.learner.checkPattern(intent);
    if (learned) {
      console.log('⚡ Using learned pattern (fast path)');
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

  async handleAPIIntegration(intent) {
    console.log('🎯 User wants to add a new API');

    // Extract API name and key from intent
    const apiInfo = this.extractAPIInfo(intent);

    if (!apiInfo.name && !apiInfo.url) {
      return {
        success: false,
        message: 'Please specify which API to integrate',
        example: 'Try: "integrate Stripe API with key sk_test_..."'
      };
    }

    // Learn the API automatically!
    const result = await this.apiLearner.learnAPI(apiInfo);

    if (result.success) {
      return {
        success: true,
        message: result.message,
        endpoints: result.endpoints,
        ready: true,
        example: `Now you can use commands like: "charge $50 using ${apiInfo.name}"`
      };
    }

    return result;
  }

  extractAPIInfo(intent) {
    // Extract API name
    const nameMatch = intent.match(/integrate\s+(\w+)|add\s+(\w+)/i);
    const name = nameMatch ? (nameMatch[1] || nameMatch[2]) : null;

    // Extract API key
    const keyMatch = intent.match(/key[:\s]+([^\s]+)|api[_\s]?key[:\s]+([^\s]+)/i);
    const apiKey = keyMatch ? (keyMatch[1] || keyMatch[2]) : null;

    // Extract URL if provided
    const urlMatch = intent.match(/https?:\/\/[^\s]+/);
    const url = urlMatch ? urlMatch[0] : null;

    return { name, apiKey, url };
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
