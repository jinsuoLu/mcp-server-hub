#!/usr/bin/env node
/**
 * 📁 MCP Filesystem Server
 * Safe file read/write/list/search operations within allowed directories.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { success, error, requireParam, getOptionalParam } from "@mcp-hub/shared";
import * as fs from "node:fs";
import * as path from "node:path";

// ── Security: restrict to allowed directories ─────────

const ALLOWED_DIRS: string[] = (() => {
  const dirs = [
    process.env.HOME || "/home/user",
    "/tmp",
    process.cwd(),
  ];
  // Add any dirs from MCP_ALLOWED_DIRS env var
  if (process.env.MCP_ALLOWED_DIRS) {
    dirs.push(...process.env.MCP_ALLOWED_DIRS.split(":"));
  }
  return dirs.filter((d) => d && fs.existsSync(d));
})();

function isAllowed(targetPath: string): boolean {
  const resolved = path.resolve(targetPath);
  return ALLOWED_DIRS.some((dir) => resolved.startsWith(path.resolve(dir)));
}

function safeResolve(targetPath: string): string {
  const resolved = path.resolve(targetPath);
  if (!isAllowed(resolved)) {
    throw new Error(
      `Access denied: "${targetPath}" is outside allowed directories.\n` +
        `Allowed: ${ALLOWED_DIRS.join(", ")}\n` +
        `Set MCP_ALLOWED_DIRS env var to add more.`
    );
  }
  return resolved;
}

// ── Server ────────────────────────────────────────────

const server = new Server(
  { name: "mcp-server-filesystem", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "read_file",
      description: "Read the contents of a file.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path" },
          encoding: {
            type: "string",
            description: "Encoding (default: utf-8)",
          },
        },
        required: ["path"],
      },
    },
    {
      name: "write_file",
      description: "Write content to a file (creates or overwrites).",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path" },
          content: { type: "string", description: "Content to write" },
        },
        required: ["path", "content"],
      },
    },
    {
      name: "list_directory",
      description: "List files and directories in a path.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Directory path. Default: current" },
        },
      },
    },
    {
      name: "file_info",
      description: "Get detailed file information (size, modified time, type).",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path" },
        },
        required: ["path"],
      },
    },
    {
      name: "search_files",
      description: "Search for files matching a pattern in a directory.",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Directory to search" },
          pattern: { type: "string", description: "Search pattern (simple glob: *.js, test*)" },
          recursive: { type: "boolean", description: "Search recursively (default: false)" },
        },
        required: ["directory", "pattern"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "read_file": {
        const filePath = safeResolve(requireParam(args, "path"));
        const encoding = getOptionalParam(args, "encoding", "utf-8");
        const content = fs.readFileSync(filePath, encoding as BufferEncoding);
        const stats = fs.statSync(filePath);
        const preview =
          content.length > 2000
            ? content.slice(0, 2000) + `\n... (${content.length - 2000} more chars)`
            : content;
        return success(`📄 ${path.basename(filePath)} (${formatSize(stats.size)})\n\n${preview}`);
      }

      case "write_file": {
        const filePath = safeResolve(requireParam(args, "path"));
        const content = requireParam(args, "content");
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, content, "utf-8");
        return success(`✅ Written: ${filePath} (${content.length} chars)`);
      }

      case "list_directory": {
        const dirPath = safeResolve(
          getOptionalParam(args, "path", process.cwd())
        );
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        const lines: string[] = [`📁 ${dirPath}\n`];

        const dirs = entries.filter((e) => e.isDirectory());
        const files = entries.filter((e) => !e.isDirectory());

        if (dirs.length) {
          lines.push(`📂 Directories (${dirs.length}):`);
          dirs.forEach((d) => lines.push(`  📁 ${d.name}/`));
        }
        if (files.length) {
          lines.push(`📄 Files (${files.length}):`);
          files.forEach((f) => {
            try {
              const s = fs.statSync(path.join(dirPath, f.name));
              lines.push(`  📄 ${f.name} (${formatSize(s.size)})`);
            } catch {
              lines.push(`  📄 ${f.name}`);
            }
          });
        }

        return success(lines.join("\n"));
      }

      case "file_info": {
        const filePath = safeResolve(requireParam(args, "path"));
        const stats = fs.statSync(filePath);
        return success(
          `📄 ${path.basename(filePath)}\n` +
            `📏 Size: ${formatSize(stats.size)}\n` +
            `📅 Created: ${stats.birthtime.toLocaleString("zh-CN")}\n` +
            `📝 Modified: ${stats.mtime.toLocaleString("zh-CN")}\n` +
            `🔐 Mode: ${stats.mode.toString(8)}\n` +
            `📌 Type: ${stats.isDirectory() ? "Directory" : stats.isFile() ? "File" : stats.isSymbolicLink() ? "Symlink" : "Other"}`
        );
      }

      case "search_files": {
        const dirPath = safeResolve(requireParam(args, "directory"));
        const pattern = requireParam(args, "pattern");
        const recursive = args?.recursive === true;

        const regex = new RegExp(
          "^" +
            pattern
              .replace(/\*/g, ".*")
              .replace(/\?/g, ".")
              .replace(/\./g, "\\.") +
            "$",
          "i"
        );

        const results: string[] = [];
        function search(dir: string, depth: number) {
          if (depth > 20) return; // safety limit
          try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const e of entries) {
              if (e.name.startsWith(".")) continue;
              const full = path.join(dir, e.name);
              if (e.isDirectory() && recursive) search(full, depth + 1);
              if (regex.test(e.name)) results.push(full);
            }
          } catch {}
        }

        search(dirPath, 0);

        return success(
          `🔍 Found ${results.length} match(es) for "${pattern}" in ${dirPath}\n` +
            (results.length > 50
              ? results.slice(0, 50).join("\n") +
                `\n... and ${results.length - 50} more`
              : results.join("\n") || "(no matches)")
        );
      }

      default:
        return error(`Unknown tool: ${name}`);
    }
  } catch (e: any) {
    return error(e.message);
  }
});

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("📁 MCP Filesystem Server running on stdio");
  console.error(`   Allowed dirs: ${ALLOWED_DIRS.join(", ")}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
