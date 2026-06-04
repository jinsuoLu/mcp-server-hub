export interface Tool {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface CallToolRequest {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface ListToolsResult {
  tools: Tool[];
}

export interface CallToolResult {
  content: Array<{ type: string; text?: string; image?: string }>;
  isError?: boolean;
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