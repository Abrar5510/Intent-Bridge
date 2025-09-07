// src/mcp-server.js 

import { Server } from '@modelcontextprotocol/sdk/server/index.js'; 

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'; 

import dotenv from 'dotenv'; 

import { IntentBridge } from './core/IntentBridge.js'; 

 

// Load environment variables 

dotenv.config(); 

 

console.error('🚀 Starting IntentBridge MCP Server...'); 

 

// Initialize IntentBridge 

const intentBridge = new IntentBridge(); 

 

// Create MCP server 

const server = new Server( 

  { 

    name: 'intent-bridge', 

    version: '1.0.0', 

  }, 

  { 

    capabilities: { 

      tools: {} 

    } 

  } 

); 

 

// Register available tools 

server.setRequestHandler('tools/list', async () => ({ 

  tools: [ 

    { 

      name: 'execute_intent', 

      description: 'Execute any API action using natural language. Examples: "post to Twitter", "send Slack message", "get weather"', 

      inputSchema: { 

        type: 'object', 

        properties: { 

          intent: { 

            type: 'string', 

            description: 'Natural language description of what you want to do' 

          } 

        }, 

        required: ['intent'] 

      } 

    }, 

    { 

      name: 'list_apis', 

      description: 'List all available API integrations', 

      inputSchema: { 

        type: 'object', 

        properties: {} 

      } 

    }, 

    { 

      name: 'get_stats', 

      description: 'Get usage statistics and learned patterns', 

      inputSchema: { 

        type: 'object', 

        properties: {} 

      } 

    } 

  ] 

})); 

 

// Handle tool execution 

server.setRequestHandler('tools/call', async (request) => { 

  const { name, arguments: args } = request.params; 

   

  console.error(`📞 Tool called: ${name}`); 

   

  try { 

    switch (name) { 

      case 'execute_intent': { 

        console.error(`🎯 Executing intent: "${args.intent}"`); 

        const result = await intentBridge.execute(args.intent); 

         

        return { 

          content: [ 

            { 

              type: 'text', 

              text: JSON.stringify(result, null, 2) 

            } 

          ] 

        }; 

      } 

       

      case 'list_apis': { 

        const apis = intentBridge.listAPIs(); 

        return { 

          content: [ 

            { 

              type: 'text', 

              text: `Available APIs:\n${apis.map(api => `• ${api}`).join('\n')}` 

            } 

          ] 

        }; 

      } 

       

      case 'get_stats': { 

        const stats = intentBridge.getStats(); 

        return { 

          content: [ 

            { 

              type: 'text', 

              text: `Statistics:\n${JSON.stringify(stats, null, 2)}` 

            } 

          ] 

        }; 

      } 

       

      default: 

        throw new Error(`Unknown tool: ${name}`); 

    } 

  } catch (error) { 

    console.error(`❌ Error: ${error.message}`); 

    return { 

      content: [ 

        { 

          type: 'text', 

          text: `Error: ${error.message}` 

        } 

      ], 

      isError: true 

    }; 

  } 

}); 

 

// Connect to transport 

const transport = new StdioServerTransport(); 

server.connect(transport); 

 

console.error('✅ IntentBridge MCP Server is running!'); 

console.error('📝 Available tools: execute_intent, list_apis, get_stats'); 