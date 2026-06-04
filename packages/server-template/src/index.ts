#!/usr/bin/env node
/**
 * 🏷️ SERVER_TEMPLATE
 * Copy this directory to create a new MCP server.
 *
 * Steps:
 *   1. cp -r packages/server-template packages/server-YOURNAME
 *   2. Edit package.json (name, description, keywords)
 *   3. Implement tools in src/index.ts
 *   4. Add to cli registry (packages/cli/src/index.ts → REGISTRY array)
 *   5. Update root README
 *   6. pnpm install && pnpm build
 */
import{Server}from"@modelcontextprotocol/sdk/server/index.js";import{StdioServerTransport}from"@modelcontextprotocol/sdk/server/stdio.js";import{CallToolRequestSchema,ListToolsRequestSchema}from"@modelcontextprotocol/sdk/types.js";import{success,error,requireParam}from"@mcp-hub/shared";
const server=new Server({name:"mcp-server-template",version:"1.0.0"},{capabilities:{tools:{}}});
server.setRequestHandler(ListToolsRequestSchema,async()=>({tools:[{name:"hello",description:"A demo tool - replace with your own!",inputSchema:{type:"object",properties:{name:{type:"string",description:"Your name"}},required:["name"]}},{name:"ping",description:"Simple health check.",inputSchema:{type:"object",properties:{}}}]}));
server.setRequestHandler(CallToolRequestSchema,async(request)=>{try{const{name,arguments:args}=request.params;switch(name){case"hello":{const n=requireParam(args,"name");return success(`👋 Hello ${n}! This is the template server. Replace me with your own tools!`)}
case"ping":return success("🏓 Pong! Template server is running.");default:return error(`Unknown tool:${name}`)}}catch(e){return error(e.message)}});
async function main(){const transport=new StdioServerTransport();await server.connect(transport);console.error("🏷️ MCP Template Server running on stdio")}
main().catch(e=>{console.error("Fatal error:",e);process.exit(1)});