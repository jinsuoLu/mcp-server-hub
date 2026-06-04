/**
 * MCP Server Hub - Shared Utilities
 * Common types, helpers, and error handling for all MCP servers.
 */

import type {
  CallToolRequest,
  ListToolsResult,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// ── Type Utilities ────────────────────────────────────

export type ToolHandler = (
  request: CallToolRequest
) => Promise<{ content: Array<{ type: "text"; text: string }> }>;

export interface ServerConfig {
  name: string;
  version: string;
  description: string;
}

export interface ToolDefinition extends Tool {
  handler: ToolHandler;
}

// ── Response Helpers ──────────────────────────────────

export function success(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
  };
}

export function error(message: string) {
  return {
    content: [{ type: "text" as const, text: `❌ Error: ${message}` }],
    isError: true,
  };
}

// ── Tool Helpers ──────────────────────────────────────

export function createToolsResponse(tools: Tool[]): ListToolsResult {
  return { tools };
}

export function jsonResponse(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

// ── Validation ────────────────────────────────────────

export function requireParam(
  args: Record<string, unknown> | undefined,
  key: string
): string {
  if (!args || typeof args[key] !== "string" || !args[key]) {
    throw new Error(`Missing required parameter: ${key}`);
  }
  return args[key] as string;
}

export function getOptionalParam(
  args: Record<string, unknown> | undefined,
  key: string,
  defaultValue: string
): string {
  if (!args || typeof args[key] !== "string" || !args[key]) {
    return defaultValue;
  }
  return args[key] as string;
}
