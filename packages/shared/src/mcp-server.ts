import * as readline from "node:readline";
import { Tool, ListToolsResult } from "./mcp-sdk";

interface ServerInfo {
  name: string;
  version: string;
}

interface ServerOptions {
  capabilities: {
    tools: {};
  };
}

type RequestHandler<T> = (request: { params: T }) => Promise<unknown>;

export class Server {
  private serverInfo: ServerInfo;
  private tools: Tool[] = [];
  private handlers: Map<string, RequestHandler<unknown>> = new Map();
  private transport: StdioServerTransport | null = null;

  constructor(info: ServerInfo, options: ServerOptions) {
    this.serverInfo = info;
  }

  setRequestHandler<T>(schema: unknown, handler: RequestHandler<T>) {
    const schemaKey = JSON.stringify(schema);
    this.handlers.set(schemaKey, handler as RequestHandler<unknown>);
    if (schema === CallToolRequestSchema) {
      this.handlers.set("call_tool", handler as RequestHandler<unknown>);
    } else if (schema === ListToolsRequestSchema) {
      this.handlers.set("list_tools", handler as RequestHandler<unknown>);
    }
  }

  async connect(transport: StdioServerTransport): Promise<void> {
    this.transport = transport;
    this.transport.setServer(this);
    this.transport.start();
  }

  async handleRequest(request: string): Promise<string> {
    try {
      const parsed = JSON.parse(request);
      const { type, name, arguments: args } = parsed;

      let result: unknown;
      if (type === "list_tools") {
        const handler = this.handlers.get("list_tools");
        if (handler) {
          result = await handler({ params: {} });
        } else {
          result = { tools: [] };
        }
      } else if (type === "call_tool" && name) {
        const handler = this.handlers.get("call_tool");
        if (handler) {
          result = await handler({ params: { name, arguments: args } });
        } else {
          result = {
            content: [{ type: "text", text: `Error: Tool ${name} not found` }],
            isError: true,
          };
        }
      } else {
        result = {
          content: [{ type: "text", text: "Error: Invalid request" }],
          isError: true,
        };
      }

      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` }],
        isError: true,
      });
    }
  }
}

export class StdioServerTransport {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on("line", async (line) => {
      if (this.server) {
        const response = await this.server.handleRequest(line);
        console.log(response);
      }
    });
  }
}

export const CallToolRequestSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    arguments: { type: "object" },
  },
  required: ["name"],
} as const;

export const ListToolsRequestSchema = {
  type: "object",
  properties: {},
} as const;