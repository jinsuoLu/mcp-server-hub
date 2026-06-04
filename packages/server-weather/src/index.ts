#!/usr/bin/env node
/**
 * 🌤️ MCP Weather Server
 * Free weather API via Open-Meteo (no API key needed).
 *
 * Tools:
 *   - get_forecast: 7-day weather forecast
 *   - get_current: current conditions
 *   - get_air_quality: air quality index
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { success, error, requireParam, jsonResponse } from "@mcp-hub/shared";

// ── Server Setup ──────────────────────────────────────

const server = new Server(
  { name: "mcp-server-weather", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── Weather API ───────────────────────────────────────

async function fetchWeather(lat: string, lon: string) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  return res.json();
}

async function fetchAirQuality(lat: string, lon: string) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Air Quality API error: ${res.status}`);
  return res.json();
}

// ── WMO Weather Code Mapping ──────────────────────────

const WMO_CODES: Record<number, string> = {
  0: "☀️ Clear sky",
  1: "🌤️ Mainly clear",
  2: "⛅ Partly cloudy",
  3: "☁️ Overcast",
  45: "🌫️ Foggy",
  48: "🌫️ Depositing rime fog",
  51: "🌧️ Light drizzle",
  53: "🌧️ Moderate drizzle",
  55: "🌧️ Dense drizzle",
  61: "🌧️ Slight rain",
  63: "🌧️ Moderate rain",
  65: "🌧️ Heavy rain",
  71: "❄️ Slight snow",
  73: "❄️ Moderate snow",
  75: "❄️ Heavy snow",
  77: "❄️ Snow grains",
  80: "🌧️ Slight rain showers",
  81: "🌧️ Moderate rain showers",
  82: "🌧️ Violent rain showers",
  85: "❄️ Slight snow showers",
  86: "❄️ Heavy snow showers",
  95: "⛈️ Thunderstorm",
  96: "⛈️ Thunderstorm with slight hail",
  99: "⛈️ Thunderstorm with heavy hail",
};

function weatherEmoji(code: number): string {
  return WMO_CODES[code]?.split(" ")[0] ?? "❓";
}

function weatherDesc(code: number): string {
  return WMO_CODES[code]?.split(" ").slice(1).join(" ") ?? "Unknown";
}

// ── Tool: get_forecast ────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_forecast",
      description:
        "Get 7-day weather forecast for any location. Provide latitude and longitude coordinates.",
      inputSchema: {
        type: "object",
        properties: {
          latitude: {
            type: "string",
            description: "Latitude (e.g., '39.9042' for Beijing)",
          },
          longitude: {
            type: "string",
            description: "Longitude (e.g., '116.4074' for Beijing)",
          },
        },
        required: ["latitude", "longitude"],
      },
    },
    {
      name: "get_current",
      description: "Get current weather conditions for any location.",
      inputSchema: {
        type: "object",
        properties: {
          latitude: { type: "string", description: "Latitude" },
          longitude: { type: "string", description: "Longitude" },
        },
        required: ["latitude", "longitude"],
      },
    },
    {
      name: "get_air_quality",
      description: "Get current air quality index for any location.",
      inputSchema: {
        type: "object",
        properties: {
          latitude: { type: "string", description: "Latitude" },
          longitude: { type: "string", description: "Longitude" },
        },
        required: ["latitude", "longitude"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "get_forecast": {
        const lat = requireParam(args, "latitude");
        const lon = requireParam(args, "longitude");
        const data = await fetchWeather(lat, lon);

        const lines: string[] = [
          `📍 Forecast for ${lat}, ${lon}`,
          `🌡️ Current: ${data.current.temperature_2m}°C (feels like ${data.current.apparent_temperature}°C)`,
          `${weatherEmoji(data.current.weather_code)} ${weatherDesc(data.current.weather_code)}`,
          `💨 Wind: ${data.current.wind_speed_10m} km/h`,
          `💧 Humidity: ${data.current.relative_humidity_2m}%`,
          ``,
          `📅 7-Day Forecast:`,
        ];

        for (let i = 0; i < Math.min(7, data.daily.time.length); i++) {
          const code = data.daily.weather_code[i];
          const rain = data.daily.precipitation_probability_max[i];
          lines.push(
            `  ${data.daily.time[i]}: ${weatherEmoji(code)} ${data.daily.temperature_2m_min[i]}°C ~ ${data.daily.temperature_2m_max[i]}°C  🌧️${rain}%`
          );
        }

        return success(lines.join("\n"));
      }

      case "get_current": {
        const lat = requireParam(args, "latitude");
        const lon = requireParam(args, "longitude");
        const data = await fetchWeather(lat, lon);
        const c = data.current;

        return success(
          `📍 ${lat}, ${lon}\n` +
            `${weatherEmoji(c.weather_code)} ${weatherDesc(c.weather_code)}\n` +
            `🌡️ Temperature: ${c.temperature_2m}°C\n` +
            `🤔 Feels like: ${c.apparent_temperature}°C\n` +
            `💨 Wind: ${c.wind_speed_10m} km/h (${c.wind_direction_10m}°)\n` +
            `💧 Humidity: ${c.relative_humidity_2m}%`
        );
      }

      case "get_air_quality": {
        const lat = requireParam(args, "latitude");
        const lon = requireParam(args, "longitude");
        const data = await fetchAirQuality(lat, lon);
        const aq = data.current;

        const usAqi = aq.us_aqi;
        const level =
          usAqi <= 50
            ? "🟢 Good"
            : usAqi <= 100
            ? "🟡 Moderate"
            : usAqi <= 150
            ? "🟠 Unhealthy for Sensitive"
            : usAqi <= 200
            ? "🔴 Unhealthy"
            : usAqi <= 300
            ? "🟣 Very Unhealthy"
            : "🟤 Hazardous";

        return success(
          `🌬️ Air Quality - ${lat}, ${lon}\n` +
            `📊 US AQI: ${usAqi} ${level}\n` +
            `📊 EU AQI: ${aq.european_aqi}\n` +
            `🔬 PM2.5: ${aq.pm2_5} µg/m³\n` +
            `🔬 PM10: ${aq.pm10} µg/m³\n` +
            `🫁 CO: ${aq.carbon_monoxide} µg/m³\n` +
            `🫁 NO₂: ${aq.nitrogen_dioxide} µg/m³`
        );
      }

      default:
        return error(`Unknown tool: ${name}`);
    }
  } catch (e: any) {
    return error(e.message);
  }
});

// ── Start Server ──────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🌤️ MCP Weather Server running on stdio");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
