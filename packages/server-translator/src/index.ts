#!/usr/bin/env node
/**
 * 🌍 MCP Translator Server
 * Free translation via MyMemory API (no key).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { success, error, requireParam, getOptionalParam } from "@mcp-hub/shared";

const server = new Server(
  { name: "mcp-server-translator", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── Languages ─────────────────────────────────────────

const LANG_MAP: Record<string, string> = {
  "zh": "Chinese", "zh-CN": "Chinese (Simplified)",
  "en": "English", "ja": "Japanese", "ko": "Korean",
  "fr": "French", "de": "German", "es": "Spanish",
  "pt": "Portuguese", "ru": "Russian", "ar": "Arabic",
  "hi": "Hindi", "it": "Italian", "nl": "Dutch",
  "pl": "Polish", "tr": "Turkish", "vi": "Vietnamese",
  "th": "Thai", "id": "Indonesian", "ms": "Malay",
  "sv": "Swedish", "no": "Norwegian", "da": "Danish",
  "fi": "Finnish", "el": "Greek", "he": "Hebrew",
  "uk": "Ukrainian", "ro": "Romanian", "bg": "Bulgarian",
};

async function translate(text: string, from: string, to: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Translation API error: ${resp.status}`);
  const data = await resp.json();
  if (data.responseStatus !== 200) {
    throw new Error(`Translation failed: ${data.responseDetails || "unknown"}`);
  }
  return data.responseData.translatedText;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "translate",
      description:
        `Translate text between languages. Supported: ${Object.keys(LANG_MAP).join(", ")}. Uses MyMemory (free, no API key needed).`,
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to translate" },
          from: {
            type: "string",
            description: "Source language code (or 'auto' for auto-detect)",
          },
          to: {
            type: "string",
            description: "Target language code (e.g., 'zh', 'en', 'ja', 'ko', 'fr')",
          },
        },
        required: ["text", "to"],
      },
    },
    {
      name: "list_languages",
      description: "List all supported language codes and names.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "detect_language",
      description: "Detect the language of given text.",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to analyze" },
        },
        required: ["text"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "translate": {
        const text = requireParam(args, "text");
        const from = getOptionalParam(args, "from", "auto");
        const to = requireParam(args, "to");

        if (to !== "auto" && !LANG_MAP[to]) {
          throw new Error(
            `Unknown language: ${to}. Use list_languages to see supported codes.`
          );
        }

        const result = await translate(text, from, to);
        const fromName = from === "auto" ? "Auto" : LANG_MAP[from] || from;
        const toName = LANG_MAP[to] || to;

        return success(
          `🌍 Translation\n` +
            `📥 ${fromName} → 📤 ${toName}\n` +
            `📝 Original: ${text}\n` +
            `✨ Result: ${result}`
        );
      }

      case "list_languages": {
        const lines = ["🌍 Supported Languages:\n"];
        for (const [code, name] of Object.entries(LANG_MAP)) {
          lines.push(`  ${code.padEnd(8)} ${name}`);
        }
        return success(lines.join("\n"));
      }

      case "detect_language": {
        const text = requireParam(args, "text");
        // Use the API with auto detection
        const result = await translate(text.slice(0, 50), "auto", "en");
        // The API doesn't directly return detected language, so use heuristics
        const hasChinese = /[\u4e00-\u9fff]/.test(text);
        const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
        const hasKorean = /[\uac00-\ud7af]/.test(text);
        const hasArabic = /[\u0600-\u06ff]/.test(text);
        const hasCyrillic = /[\u0400-\u04ff]/.test(text);

        let detected = "en";
        if (hasJapanese) detected = "ja";
        else if (hasChinese) detected = "zh";
        else if (hasKorean) detected = "ko";
        else if (hasArabic) detected = "ar";
        else if (hasCyrillic) detected = "ru";

        return success(
          `🔍 Language Detection\n` +
            `📝 Text: ${text.slice(0, 100)}${text.length > 100 ? "..." : ""}\n` +
            `🏷️ Detected: ${LANG_MAP[detected]} (${detected})`
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
  console.error("🌍 MCP Translator Server running on stdio");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
