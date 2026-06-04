#!/usr/bin/env node
/**
 * 📅 MCP DateTime Server
 * Timezone conversion, date arithmetic, countdown.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { success, error, requireParam, getOptionalParam } from "@mcp-hub/shared";

const server = new Server(
  { name: "mcp-server-datetime", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── Helpers ───────────────────────────────────────────

function nowInTZ(timezone: string): Date {
  const now = new Date();
  const str = now.toLocaleString("en-US", { timeZone: timezone });
  return new Date(str);
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDateTime(d: Date): string {
  return d.toLocaleString("zh-CN", { hour12: false });
}

const DAYS_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_current_time",
      description: "Get current date and time in any timezone.",
      inputSchema: {
        type: "object",
        properties: {
          timezone: {
            type: "string",
            description: "IANA timezone (e.g., 'Asia/Shanghai', 'America/New_York'). Default: local",
          },
        },
      },
    },
    {
      name: "convert_timezone",
      description: "Convert a datetime from one timezone to another.",
      inputSchema: {
        type: "object",
        properties: {
          datetime: { type: "string", description: "ISO 8601 datetime (e.g., '2026-04-30T16:00:00')" },
          from_tz: { type: "string", description: "Source timezone" },
          to_tz: { type: "string", description: "Target timezone" },
        },
        required: ["datetime", "from_tz", "to_tz"],
      },
    },
    {
      name: "calculate_date",
      description: "Calculate a date N days from today or a given date.",
      inputSchema: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of days (negative for past)" },
          from_date: { type: "string", description: "From date (YYYY-MM-DD). Default: today" },
        },
        required: ["days"],
      },
    },
    {
      name: "day_of_week",
      description: "Get the day of week for a given date.",
      inputSchema: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date in YYYY-MM-DD format. Default: today" },
        },
      },
    },
    {
      name: "countdown",
      description: "Count days until a target date.",
      inputSchema: {
        type: "object",
        properties: {
          target: { type: "string", description: "Target date (YYYY-MM-DD)" },
        },
        required: ["target"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "get_current_time": {
        const tz = getOptionalParam(args, "timezone", "Asia/Shanghai");
        const d = nowInTZ(tz);
        return success(
          `🕐 Current Time (${tz})\n` +
            `📅 Date: ${formatDate(d)}\n` +
            `⏰ Time: ${d.toLocaleTimeString("zh-CN", { hour12: false })}\n` +
            `📌 ${DAYS_CN[d.getDay()]} Week ${Math.ceil(d.getDate() / 7)}\n` +
            `🕐 Unix: ${Math.floor(d.getTime() / 1000)}`
        );
      }

      case "convert_timezone": {
        const dt = requireParam(args, "datetime");
        const from = requireParam(args, "from_tz");
        const to = requireParam(args, "to_tz");

        const srcDate = new Date(dt);
        const srcStr = srcDate.toLocaleString("en-US", { timeZone: from });
        const dstStr = srcDate.toLocaleString("en-US", { timeZone: to });

        return success(
          `🌍 Timezone Conversion\n` +
            `📍 ${from}: ${new Date(srcStr).toLocaleString("zh-CN", { hour12: false })}\n` +
            `➡️ ${to}: ${new Date(dstStr).toLocaleString("zh-CN", { hour12: false })}`
        );
      }

      case "calculate_date": {
        const days = Number(args?.days ?? 0);
        const from = args?.from_date
          ? new Date(args.from_date as string)
          : new Date();
        if (isNaN(from.getTime())) throw new Error("Invalid from_date format");

        const result = new Date(from);
        result.setDate(result.getDate() + days);

        return success(
          `📅 Date Calculation\n` +
            `📌 From: ${formatDate(from)} (${DAYS_CN[from.getDay()]})\n` +
            `${days >= 0 ? "➕" : "➖"} ${Math.abs(days)} days\n` +
            `🎯 Result: ${formatDate(result)} (${DAYS_CN[result.getDay()]})`
        );
      }

      case "day_of_week": {
        const dateStr = getOptionalParam(args, "date", formatDate(new Date()));
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) throw new Error("Invalid date format. Use YYYY-MM-DD.");

        return success(
          `📌 ${dateStr} is ${DAYS_CN[d.getDay()]} (Day ${d.getDay()})\n` +
            `📅 ISO Week: ${getISOWeek(d)}`
        );
      }

      case "countdown": {
        const targetStr = requireParam(args, "target");
        const target = new Date(targetStr);
        if (isNaN(target.getTime())) throw new Error("Invalid date. Use YYYY-MM-DD.");

        const now = new Date();
        const diffMs = target.getTime() - now.getTime();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (days < 0) {
          return success(
            `⏰ ${targetStr} has passed!\n` +
              `It was ${Math.abs(days)} days ago (${DAYS_CN[target.getDay()]}).`
          );
        }

        const weeks = Math.floor(days / 7);
        const remaining = days % 7;

        return success(
          `⏳ Countdown to ${targetStr} (${DAYS_CN[target.getDay()]})\n` +
            `📊 ${days} days remaining\n` +
            `🗓️ That's ${weeks} weeks ${remaining > 0 ? `+ ${remaining} days` : ""}`
        );
      }

      default:
        return error(`Unknown tool: ${name}`);
    }
  } catch (e: any) {
    return error(e.message);
  }
});

function getISOWeek(d: Date): number {
  const tmp = new Date(d);
  tmp.setHours(0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((tmp.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("📅 MCP DateTime Server running on stdio");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
