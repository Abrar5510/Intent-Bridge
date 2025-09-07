// src/core/LearningEngine.js 

import fs from 'fs/promises'; 

import path from 'path'; 

import { fileURLToPath } from 'url'; 

 

const __dirname = path.dirname(fileURLToPath(import.meta.url)); 

 

export class LearningEngine { 

  constructor() { 

    this.patterns = new Map(); 

    this.stats = { 

      totalExecutions: 0, 

      successfulExecutions: 0, 

      failedExecutions: 0, 

      uniquePatterns: 0, 

      averageResponseTime: 0 

    }; 

     

    this.dataFile = path.join(__dirname, '../../learning.json'); 

    this.loadData(); 

  } 

 

  async loadData() { 

    try { 

      const data = await fs.readFile(this.dataFile, 'utf-8'); 

      const saved = JSON.parse(data); 

       

      // Load patterns 

      if (saved.patterns) { 

        for (const [key, value] of Object.entries(saved.patterns)) { 

          this.patterns.set(key, value); 

        } 

      } 

       

      // Load stats 

      if (saved.stats) { 

        this.stats = saved.stats; 

      } 

       

      console.log(`📚 Loaded ${this.patterns.size} learned patterns`); 

    } catch (error) { 

      console.log('📝 Starting with fresh learning data'); 

    } 

  } 

 

  async saveData() { 

    const data = { 

      patterns: Object.fromEntries(this.patterns), 

      stats: this.stats, 

      lastUpdated: new Date().toISOString() 

    }; 

     

    try { 

      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2)); 

    } catch (error) { 

      console.error('Could not save learning data:', error.message); 

    } 

  } 

 

  async recordExecution(intent, parsed, apiConfig, result, responseTime) { 

    // Update stats 

    this.stats.totalExecutions++; 

     

    if (result.success) { 

      this.stats.successfulExecutions++; 

       

      // Store successful pattern 

      const key = this.generateKey(intent); 

      const pattern = { 

        intent, 

        parsed, 

        apiConfig: { 

          name: apiConfig.name, 

          endpointKey: apiConfig.endpointKey 

        }, 

        executionCount: 1, 

        averageResponseTime: responseTime, 

        lastUsed: new Date().toISOString() 

      }; 

       

      if (this.patterns.has(key)) { 

        const existing = this.patterns.get(key); 

        existing.executionCount++; 

        existing.averageResponseTime =  

          (existing.averageResponseTime * (existing.executionCount - 1) + responseTime) /  

          existing.executionCount; 

        existing.lastUsed = new Date().toISOString(); 

      } else { 

        this.patterns.set(key, pattern); 

        this.stats.uniquePatterns++; 

      } 

    } else { 

      this.stats.failedExecutions++; 

    } 

     

    // Update average response time 

    this.stats.averageResponseTime =  

      (this.stats.averageResponseTime * (this.stats.totalExecutions - 1) + responseTime) /  

      this.stats.totalExecutions; 

     

    await this.saveData(); 

  } 

 

  checkPattern(intent) { 

    const key = this.generateKey(intent); 

    return this.patterns.get(key); 

  } 

 

  generateKey(intent) { 

    return intent 

      .toLowerCase() 

      .trim() 

      .replace(/['"]/g, '') 

      .replace(/\s+/g, '_'); 

  } 

 

  getStats() { 

    const topPatterns = Array.from(this.patterns.values()) 

      .sort((a, b) => b.executionCount - a.executionCount) 

      .slice(0, 5) 

      .map(p => ({ 

        intent: p.intent, 

        count: p.executionCount 

      })); 

     

    return { 

      ...this.stats, 

      topPatterns, 

      successRate: this.stats.totalExecutions > 0  

        ? ((this.stats.successfulExecutions / this.stats.totalExecutions) * 100).toFixed(1) + '%' 

        : 'N/A' 

    }; 

  } 

} 