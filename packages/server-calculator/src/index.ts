#!/usr/bin/env node
/**
 * 🔢 MCP Calculator Server
 * Safe math expression evaluation with detailed output.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { success, error, requireParam } from "@mcp-hub/shared";

const server = new Server(
  { name: "mcp-server-calculator", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── Safe Expression Evaluator ─────────────────────────

function safeEval(expr: string): number {
  // Only allow safe characters
  const sanitized = expr.replace(/[^0-9+\-*/().%^\s]|Math\.\w+/g, "");
  if (sanitized !== expr) {
    throw new Error(
      "Expression contains unsafe characters. Allowed: digits, + - * / ( ) . % ^, Math.* functions"
    );
  }

  // Block dangerous patterns
  if (/[^=]=[^=]|\bnew\b|\bFunction\b|__/i.test(expr)) {
    throw new Error("Expression contains potentially unsafe patterns");
  }

  // Replace ^ with **
  let processed = expr.replace(/\^/g, "**");

  // Replace % with /100 for percentage
  processed = processed.replace(/(\d+)%/g, "($1/100)");

  const result = Function(`"use strict"; return (${processed})`)();

  if (typeof result !== "number" || !isFinite(result)) {
    throw new Error(`Invalid result: ${result}`);
  }

  return result;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return parseFloat(n.toPrecision(12)).toString();
}

// ── Unit Conversions ──────────────────────────────────

const CONVERSIONS: Record<
  string,
  { from: string; to: string; factor: number }
> = {
  "km-mi": { from: "km", to: "miles", factor: 0.621371 },
  "mi-km": { from: "miles", to: "km", factor: 1.60934 },
  "c-f": { from: "°C", to: "°F", factor: NaN }, // special
  "f-c": { from: "°F", to: "°C", factor: NaN }, // special
  "kg-lb": { from: "kg", to: "lb", factor: 2.20462 },
  "lb-kg": { from: "lb", to: "kg", factor: 0.453592 },
  "cm-in": { from: "cm", to: "inches", factor: 0.393701 },
  "in-cm": { from: "inches", to: "cm", factor: 2.54 },
  "m-ft": { from: "m", to: "feet", factor: 3.28084 },
  "ft-m": { from: "feet", to: "m", factor: 0.3048 },
  "l-gal": { from: "L", to: "gal", factor: 0.264172 },
  "gal-l": { from: "gal", to: "L", factor: 3.78541 },
};

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "calculate",
      description:
        "Evaluate a mathematical expression. Supports: + - * / ( ) . ^ ** % Math.sqrt/pow/abs/round/ceil/floor/sin/cos/tan/log/log10/PI/E.",
      inputSchema: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "Math expression, e.g., '2 + 3 * 4', 'Math.sqrt(144)', '100 * 1.1 ^ 5'",
          },
        },
        required: ["expression"],
      },
    },
    {
      name: "convert_unit",
      description:
        "Convert between common units (length, weight, temperature, volume).",
      inputSchema: {
        type: "object",
        properties: {
          value: { type: "number", description: "Value to convert" },
          conversion: {
            type: "string",
            description:
              "Conversion key: km-mi, mi-km, c-f, f-c, kg-lb, lb-kg, cm-in, in-cm, m-ft, ft-m, l-gal, gal-l",
          },
        },
        required: ["value", "conversion"],
      },
    },
    {
      name: "hex_dec",
      description: "Convert between hexadecimal and decimal.",
      inputSchema: {
        type: "object",
        properties: {
          value: { type: "string", description: "Hex (0x...) or decimal number" },
        },
        required: ["value"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "calculate": {
        const expr = requireParam(args, "expression");
        const result = safeEval(expr);
        return success(
          `🔢 ${expr}\n` +
            `📊 = ${formatNumber(result)}\n` +
            `🔬 Scientific: ${result.toExponential(6)}`
        );
      }

      case "convert_unit": {
        const value = Number(args?.value);
        const key = requireParam(args, "conversion");

        const conv = CONVERSIONS[key];
        if (!conv) {
          throw new Error(
            `Unknown conversion: ${key}. Try: ${Object.keys(CONVERSIONS).join(", ")}`
          );
        }

        let result: number;
        if (key === "c-f") {
          result = value * (9 / 5) + 32;
        } else if (key === "f-c") {
          result = (value - 32) * (5 / 9);
        } else {
          result = value * conv.factor;
        }

        return success(
          `📐 Unit Conversion\n` +
            `${value} ${conv.from} = ${formatNumber(result)} ${conv.to}`
        );
      }

      case "hex_dec": {
        const val = requireParam(args, "value");
        let dec: number;
        let hex: string;

        if (val.startsWith("0x") || val.startsWith("0X")) {
          dec = parseInt(val, 16);
          hex = val.toUpperCase();
        } else if (/^[0-9a-fA-F]+$/.test(val) && /[a-fA-F]/.test(val)) {
          dec = parseInt(val, 16);
          hex = "0x" + val.toUpperCase();
        } else {
          dec = parseInt(val, 10);
          hex = "0x" + dec.toString(16).toUpperCase();
        }

        if (isNaN(dec)) throw new Error("Invalid number format");

        return success(
          `🔢 Number Conversion\n` +
            `📊 Decimal: ${dec}\n` +
            `🔣 Hex: ${hex}\n` +
            `💻 Binary: 0b${dec.toString(2)}\n` +
            `📏 Octal: 0o${dec.toString(8)}`
        );
      }

      default:
        return error(`Unknown tool: ${name}`);
    }
  } catch (e: any) {
    return error(e.message);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🔢 MCP Calculator Server running on stdio");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
